/* =========================================================== *
 * @site http://tt-cc.cc
 * @email ttccmvp@gmail.com
 * Copyright 2016 ttcc
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
(function () {
    var gameStatusEnum = {
        none: 0, // 初始
        ready: 1, // 倒计时
        playing: 2, // 进行中
        hitting: 3, // 正确敲击中
        end: 4
    }; // 游戏状态
    var gameStatus = gameStatusEnum.none;
    var defaults = {
        cfg: false,
        winScore: 5,
        equalScore: 3,
        looseScore: 2,
        gameTime: 20, // 游戏时长s
        turnNum: 3, // 初始自动翻面商标数
        turnTime: 3000, // 商标自动翻面时长
        wrongTime: 1000, // 敲错减少游戏时间数
        logoAddInter: 10000, // 增加一个翻面logo的间隔
        wrongNum: 1, // 翻面LOGO的错误数
        hitInter: 400, // 玩家连续敲击间隔，至少大于 hHitTime
        ohitRating: 0.6, // 机器人命中率
        oMinHitTime: 500
        // 机器人 最小反应时间
    };
    var settings = {
        token: null,
        startDate: null,
        overTimesLimit: false,
        mode: 1, // 1 练习模式，2 战斗模式
        leftStepTime: defaults.gameTime, // 剩余游戏步长
        hHitTime: 400, // 锤子敲击动画时长
        turnNum: defaults.turnNum, // 初始自动翻面商标数
        rlogos: ["icons/r-1.png", "icons/r-2.png", "icons/r-3.png", "icons/r-4.png",
            "icons/r-5.png", "icons/r-6.png", "icons/r-6.png", "icons/r-7.png",],
        initwlogos: ["icons/w-1.png", "icons/w-2.png", "icons/w-3.png", "icons/w-4.png", "icons/w-5.png"],
        wlogos: [], // 已翻面随机的错误logo
        mhitting: false, // 玩家是否可连续敲击标识
        flipArray: [], // 已翻面正确logo集合
        hittimeout: null, // 机器人自动敲击时间计时器
        bartimeintervar: null, // 游戏剩余时间进度条计时器
        brandtimeintervar: null
        // 游戏商标翻转计时器
    };
    Jy.pimgs(["image/num_3.png", "image/num_2.png", "image/num_1.png",
        "image/num_go.png", "image/bg_count.png"]);
    var mscoure = 0, oscore = 0;
    var mhammer = Jo("mhammer"), // 我的锤子
        ohammer = Jo("ohammer"), // 机器人锤子
        bar = Jo("progress-bar"), // 进度条
        rightEffect = Jo("hright"), // 正确效果
        bartime = Jo("progress-time"), // 进度条
        brands = Jo("brand-container").getElementsByTagName("li"); // 商标集合
    function initGame() {
        Jo("mode").hide();
        Jo("mev").textContent = "0";
        Jo("otv").textContent = "0";
        mscoure = 0;
        oscore = 0;
        bar.style.width = "100%";
        bar.style.backgroundColor = "#86e01e";
        Jo("game-result").hide();
        bartime.textContent = defaults.gameTime.toFixed(1) + "s";
        settings.turnNum = defaults.turnNum;
        settings.leftStepTime = 0;
        startGame();
    }

    function startGame() {
        gameStatus = gameStatusEnum.ready;
        var countDown = Jo("count-dwon"), countNum = Jo("count-num"), countLight = Jo("count-light");
        countDown.show();
        countNum.src = "image/num_3.png";
        Jo(countLight.acls("countdown").show().parentNode).acls("show");
        var time = 0, counttimer = setInterval(function () {
            if (time == 16) {
                countNum.src = "image/num_2.png";
            } else if (time == 32) {
                countNum.src = "image/num_1.png";
            } else if (time == 48) {
                Jo(countLight.parentNode).mcls("show");
                countLight.mcls("countdown").hide();
                countNum.src = "image/num_go.png";
            } else if (time == 64) {
                clearInterval(counttimer);
                countDown.hide();
                gameTimer();
                newRound();
            }
            time++;
        }, 50);
        shuffle();
        Jy.pimgs(settings.rlogos);
        Jy.pimgs(settings.wlogos);
    }

    function shuffle() {
        settings.wlogos = [];
        while (settings.initwlogos.length > 0) {
            var index = Jy.rd(0, settings.initwlogos.length - 1, 1);
            settings.wlogos.push(settings.initwlogos[index]);
            settings.initwlogos.splice(index, 1);
        }
        settings.initwlogos = settings.wlogos.slice(0);
    }

    function gameTimer() {
        settings.leftStepTime = defaults.gameTime * 10;
        var ttime = defaults.gameTime * 10;
        settings.bartimeintervar && clearInterval(settings.bartimeintervar);
        // 游戏倒计时
        settings.bartimeintervar = window.setInterval(function () {
            bar.style.width = settings.leftStepTime * 100 / ttime + "%";
            bartime.textContent = (settings.leftStepTime / 10).toFixed(1) + "s";
            if ((settings.leftStepTime - 1) % (defaults.logoAddInter / 100) == 0 && settings.turnNum < 9) {
                settings.turnNum += 1;
            }
            settings.leftStepTime--;
            if (settings.leftStepTime < 0) {
                gameOver();
            }
        }, 100);
    }

    function newRound() {
        if (gameStatus != gameStatusEnum.ready && gameStatus != gameStatusEnum.hitting) {
            return;
        }
        gameStatus = gameStatusEnum.playing;
        // 游戏商标翻转计时器
        clearInterval(settings.brandtimeintervar);
        settings.brandtimeintervar = window.setInterval(buildBrand, defaults.turnTime + settings.hHitTime * 2);
        buildBrand();
    }

    function buildBrand() {
        window.clearTimeout(settings.hittimeout);
        if (gameStatus != gameStatusEnum.playing) {
            clearInterval(settings.brandtimeintervar);
            return;
        }
        settings.mhitting = false;
        for (var i = 0; i < settings.flipArray.length; i++) {
            settings.flipArray[i].acls("flipped").mcls("lwrong");
        }
        settings.flipArray = [];
        window.setTimeout(function () {
            var original = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            var rlogos = settings.rlogos.slice(0), wlogos;
            settings.wlogos.length == 0 && (settings.wlogos = settings.initwlogos);
            for (var h = 0; h < settings.turnNum; h++) {
                var random = Jy.rd(0, original.length - 1, 1); // 随机取一个位置
                var index = original[random], brand = Jo(brands[index]);
                var sub = brand.getElementsByClassName("brand")[0];
                if (h <= defaults.wrongNum - 1) {
                    sub.src = settings.wlogos.pop() || "brand/1.png";
                    brand.acls("lwrong");
                } else {
                    var rlogoIndex = Jy.rd(0, rlogos.length - 1, 1);
                    sub.src = rlogos[rlogoIndex] || "brand/1.png";
                    rlogos.splice(rlogoIndex, 1);
                }
                settings.flipArray.push(brand);
                brand.mcls("flipped");
                original.splice(random, 1);
            }
            // 机器人敲击计时器
            var rtime = Jy.rd(settings.hHitTime / 1000 + defaults.oMinHitTime / 1000, defaults.turnTime / 1000,
                0);
            settings.hittimeout = window.setTimeout(function () {
                var flipd;
                if (Jy.rd(0, 1, 0) <= defaults.ohitRating) {
                    flipd = settings.flipArray[0];
                } else {
                    flipd = settings.flipArray[settings.flipArray.length - 1];
                }
                tapDown(flipd, 0);
            }, rtime * 1000);
        }, settings.hHitTime);
    }

    // 敲击动作 img：被敲击的商标，isMy：是否是玩家主动敲击（否则是机器人）
    function tapDown(img, isMy) {
        if ((isMy && settings.mhitting) || gameStatus != gameStatusEnum.playing) {
            return;
        }
        hammerHit(isMy, img);
        var cls = "hright", isRight = img.hcls("lwrong"), effect;
        if (isRight) {
            gameStatus = gameStatusEnum.hitting;
            effect = rightEffect;
            effect.style.left = img.offsetLeft + "px";
            effect.style.top = img.offsetTop + "px";
            effect.show();
            isMy ? mscoure += 1 : oscore += 1;
            var mevdom = Jo(isMy ? "mev" : "otv");
            mevdom.textContent = Number(mevdom.textContent) + 1;
            mevdom.acls("addscore");
            window.setTimeout(function () {
                mevdom.mcls("addscore");
            }, settings.hHitTime)
        } else {
            cls = "hwrong";
            effect = img;
            if (isMy) {
                settings.mhitting = true;
                settings.leftStepTime -= defaults.wrongTime / 100;
                (settings.leftStepTime < 0) && (settings.leftStepTime = 0);
            }
        }
        effect.acls(cls);
        window.setTimeout(function () {
            if (isRight) {
                effect.hide();
                newRound();
            } else if (isMy) {
                window.setTimeout(function () {
                    settings.mhitting = false;
                }, defaults.hitInter - settings.hHitTime);
            }
            effect.mcls(cls);
        }, settings.hHitTime);
    }

    function hammerHit(isMy, img) {
        var hammer = !isMy ? ohammer : mhammer, cls = isMy ? "mhit" : "ohit";
        hammer.style.left = img.offsetLeft + (isMy ? 25 : 10) + "px";
        hammer.style.top = img.offsetTop + 20 + "px";
        hammer.show();
        hammer.acls(cls);
        window.setTimeout(function () {
            hammer.hide();
            hammer.mcls(cls);
        }, settings.hHitTime);
    }

    function gameOver() {
        clearInterval(settings.bartimeintervar);
        clearInterval(settings.brandtimeintervar);
        window.clearTimeout(settings.hittimeout);
        gameStatus = gameStatusEnum.end;
        var recoverybrands = Jo("brand-container").getElementsByClassName("bra");
        for (var i = 0; i < recoverybrands.length; i++) {
            Jo(recoverybrands[i]).mcls("lwrong").acls("flipped");
        }
        settings.flipArray = [];
        settings.wlogos = [];
        mhammer.hide();
        Jo("game-result").show();
        setTimeout(function () {
            gameStatus = gameStatusEnum.none;
        }, 1000);
    }

    Jy.aevt(Jo("brand-container"), "click", function (e) {
        if (gameStatus != gameStatusEnum.playing) {
            return;
        }
        var dom = Jo(e.target || e.srcElement);
        if (dom.hcls("brand")) {
            tapDown(dom.parentNode.parentNode, 1);
        }
    }, 2);
    Jy.aevt(Jo("restart-game"), "click", function (e) {
        initGame();
    }, 2);
    Jy.aevt(Jo("start-game1"), "click", function (e) {
        initGame();
    }, 2);
})();
