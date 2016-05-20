/* =========================================================== *
 * @site http:tt-cc.cn
 * @email mvpjly@163.com
 * Copyright 2014 imwr
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
var mainLeft;
(function () {
    Jy.aevt(window, "resize", function () {
        mainLeft = Jo("main-container").offsetLeft;
    });
    mainLeft = Jo("main-container").offsetLeft;
    var html = "";
    if (Jy.fkIE) {
        html = '<embed id="vcountdown" width="0" height="0" type="audio/x-wav" autoplay="false" src="./src/music/countdown.wav"></embed>'
            + '<embed id="vhit" width="0" height="0" type="audio/x-wav" autoplay="false" src="./src/music/hit.wav"></embed>'
            + '<embed id="vhright" width="0" height="0" type="audio/x-wav" autoplay="false" src="./src/music/hright.wav"></embed>'
            + '<embed id="vhwrong" width="0" height="0" type="audio/x-wav" autoplay="false" src="./src/music/hwrong.wav"></embed>'
            + '<embed id="vgameover" width="0" height="0" type="audio/x-wav" autoplay="false" src="./src/music/gameover.wav"></embed>';
    } else {
        var fliplink = document.createElement("link");
        fliplink.setAttribute("href", "./src/css/flip.css");
        fliplink.setAttribute("type", "text/css");
        fliplink.setAttribute("rel", "stylesheet");
        document.getElementsByTagName("head")[0].appendChild(fliplink);
        html = '<audio id="vcountdown" width="0" height="0" type="audio/x-wav" src="./src/music/countdown.wav"></audio>'
            + '<audio id="vhit" width="0" height="0" type="audio/x-wav" src="./src/music/hit.wav"></audio>'
            + '<audio id="vhright" width="0" height="0" type="audio/x-wav" src="./src/music/hright.wav"></audio>'
            + '<audio id="vhwrong" width="0" height="0" type="audio/x-wav" src="./src/music/hwrong.wav"></audio>'
            + '<audio id="vgameover" width="0" height="0" type="audio/x-wav" src="./src/music/gameover.wav"></audio>';
    }
    Jo("player").innerHTML = html;
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
        turnTime: 4000, // 商标自动翻面时长
        wrongTime: 1000, // 敲错减少游戏时间数
        logoAddInter: 8000, // 增加一个翻面logo的间隔
        wrongNum: 1, // 翻面LOGO的错误数
        hitInter: 400, // 玩家连续敲击间隔，至少大于 hHitTime
        ohitRating: 0.9, // 机器人命中率
        oMinHitTime: 1000
        // 机器人 最小反应时间
    };
    var settings = {
        overTimesLimit: false,
        leftStepTime: defaults.gameTime, // 剩余游戏步长
        hHitTime: 400, // 锤子敲击动画时长
        turnNum: defaults.turnNum, // 初始自动翻面商标数
        rlogos: ["./src/icons/r-1.png", "./src/icons/r-2.png", "./src/icons/r-3.png", "./src/icons/r-4.png",
            "./src/icons/r-5.png", "./src/icons/r-6.png", "./src/icons/r-6.png", "./src/icons/r-7.png",],
        initwlogos: ["./src/icons/w-1.png", "./src/icons/w-2.png", "./src/icons/w-3.png", "./src/icons/w-4.png", "./src/icons/w-5.png"],
        wlogos: [], // 已翻面随机的错误logo
        mhitting: false, // 玩家是否可连续敲击标识
        flipArray: [], // 已翻面正确logo集合
        hittimeout: null, // 机器人自动敲击时间计时器
        bartimeintervar: null, // 游戏剩余时间进度条计时器
        brandtimeintervar: null
        // 游戏商标翻转计时器
    };
    var mscoure = 0, oscore = 0;
    var mhammer = Jo("mhammer"), // 我的锤子
        ohammer = Jo("ohammer"), // 机器人锤子
        bar = Jo("progress-bar"), // 进度条
        rightEffect = Jo("hright"), // 正确效果
        bartime = Jo("progress-time"); // 进度条
    var brands;
    if (Jy.fkIE) {
        brands = Jy.jCls("back", Jo("brand-container"));
    } else {
        brands = Jo("brand-container").getElementsByTagName("li"); // 商标集合
    }
    // 游戏开始时，定位锤子位置到开始游戏图标
    var main = Jo("main-container");
    if (!Jy.fkIE) {
        main.style.cursor = "none";
        if (!Jy.isMobile) {
            Jy.aevt(main, "mousemove", function tapMove(evt) {
                evt = evt || window.event;
                mhammer.style.left = (evt.pageX || evt.clientX) - 36 - mainLeft + "px";
                mhammer.style.top = (evt.pageY || evt.clientY) - 40 + "px";
            }, true);
        }
    } else {
        mhammer.hide();
        main.style.cursor = "url(../image/hammer.ico),auto";
        var fronts = Jy.jCls("front", Jo("brand-container"));
        for (var i = 0; i < fronts.length; i++) {
            fronts[i].parentNode.removeChild(fronts[i]);
        }
    }
    function initGame() {
        Jo("mode").hide();
        Jy.st(Jo("mev"), "0");
        Jy.st(Jo("otv"), "0");
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
        var countNum = Jo("count-dwon"), countGo = Jo("count-go");
        Jy.music("countdown");
        Jy.fkIE || Jy.isMobile || (mhammer.show());
        countNum.show();
        window.setTimeout(function () {
            countGo.src = countGo.src;
            countNum.hide();
            gameTimer();
            newRound();
        }, 3000);
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
        settings.leftStepTime = defaults.gameTime * 10, ttime = defaults.gameTime * 10;
        settings.bartimeintervar && clearInterval(settings.bartimeintervar);
        // 游戏倒计时
        settings.bartimeintervar = window.setInterval(function () {
            bar.style.width = settings.leftStepTime * 100 / ttime + "%";
            var g = Math.floor(226 - 75 / ttime * (ttime - settings.leftStepTime)), b = Math.floor(31 - 28
                / ttime * (ttime - settings.leftStepTime));
            bar.style.backgroundColor = "rgb(255," + g + "," + b + ")";
            Jy.st(bartime, (settings.leftStepTime / 10).toFixed(1) + "s");
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
        if (Jy.fkIE) {
            settings.brandtimeintervar = window.setInterval(buildIEBrand, defaults.turnTime + settings.hHitTime * 2);
        } else {
            settings.brandtimeintervar = window.setInterval(buildBrand, defaults.turnTime + settings.hHitTime * 2);
        }
        Jy.fkIE ? buildIEBrand() : buildBrand();
    }

    function ohammerhit() {
        // 机器人敲击计时器
        var rtime = Jy.rd(settings.hHitTime / 1000 + defaults.oMinHitTime / 1000, defaults.turnTime / 1000, 0);
        settings.hittimeout = null;
        settings.hittimeout = window.setTimeout(function () {
            if (Jy.rd(0, 1, 0) <= defaults.ohitRating) {
                tapDown(settings.flipArray[0], 0);
            } else {
                tapDown(settings.flipArray[settings.flipArray.length - 1], 0);
            }
        }, rtime * 1000);
    }

    function buildBrand() {
        window.clearTimeout(settings.hittimeout);
        if (gameStatus != gameStatusEnum.playing) {
            clearInterval(settings.brandtimeintervar);
            return;
        }
        settings.mhitting = false;
        // 还原已翻面商标集合
        for (var i = 0; i < settings.flipArray.length; i++) {
            settings.flipArray[i].acls("flipped").mcls("lwrong");
        }
        settings.flipArray = [];
        window.setTimeout(function () {
            var original = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            var rlogos = settings.rlogos.slice(0);
            settings.wlogos.length == 0 && (settings.wlogos = settings.initwlogos);
            for (var h = 0; h < settings.turnNum; h++) {
                var random = Jy.rd(0, original.length - 1, 1); // 随机取一个位置
                var index = original[random], brand = Jo(brands[index]);
                var sub = Jy.jCls("brand", brand)[0];
                if (h <= defaults.wrongNum - 1) {
                    sub.src = settings.wlogos.pop();
                    brand.acls("lwrong");
                } else {
                    var rlogoIndex = Jy.rd(0, rlogos.length - 1, 1);
                    sub.src = rlogos[rlogoIndex];
                    rlogos.splice(rlogoIndex, 1);
                }
                settings.flipArray.push(brand);
                brand.mcls("flipped");
                original.splice(random, 1);
            }
            ohammerhit();
        }, settings.hHitTime);
    }

    function buildIEBrand() {
        if (settings.hittimeout)
            window.clearTimeout(settings.hittimeout);
        if (gameStatus != gameStatusEnum.playing) {
            clearInterval(settings.brandtimeintervar);
            return;
        }
        settings.mhitting = false;
        // 还原已翻面商标集合
        flipIE(true);
    }

    function flipIEInit() {
        var original = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        var rlogos = settings.rlogos.slice(0);
        settings.wlogos.length == 0 && (settings.wlogos = settings.initwlogos);
        for (var h = 0; h < settings.turnNum; h++) {
            var random = Jy.rd(0, original.length - 1, 1); // 随机取一个位置
            var index = original[random], brand = Jo(brands[index]);
            var sub = Jy.jCls("iebar", brand)[0], url;
            if (h <= defaults.wrongNum - 1) {
                url = settings.wlogos.pop();
                brand.acls("lwrong");
            } else {
                var rlogoIndex = Jy.rd(0, rlogos.length - 1, 1);
                url = rlogos[rlogoIndex];
                rlogos.splice(rlogoIndex, 1);
            }
            settings.flipArray.push(brand);
            Jo(sub).acls("ieflipped").setAttribute("data", url);
            original.splice(random, 1);
        }
        flipIE(false);
        ohammerhit();
    }

    function flipIE(recovery) {
        if (settings.flipArray.length == 0) {
            recovery && flipIEInit();
            return;
        }
        var vector = 1, width1 = 110, margin = 0;
        var fliptimmer = setInterval(function () {
            if (width1 <= 0) {
                vector = -1;
                width1 = 0;
                margin = 55;
                for (var g = 0; g < settings.flipArray.length; g++) {
                    var sub = Jy.jCls("iebar", settings.flipArray[g])[0];
                    sub.src = recovery ? "./src/image/back.png" : sub.getAttribute("data");
                    if (recovery) {
                        settings.flipArray[g].mcls("lwrong");
                        sub.mcls("ieflipped");
                    }
                }
            }
            if (width1 > 110) {
                clearInterval(fliptimmer);
                for (var h = 0; h < settings.flipArray.length; h++) {
                    settings.flipArray[h].style.width = "110px";
                    settings.flipArray[h].style.marginLeft = "0px";
                }
                if (recovery) {
                    settings.flipArray = [];
                    settings.flipArray.length = 0;
                    flipIEInit();
                }
            } else {
                for (var h = 0; h < settings.flipArray.length; h++) {
                    settings.flipArray[h].style.width = width1 + "px";
                    settings.flipArray[h].style.marginLeft = margin + "px";
                }
                width1 -= vector * 55 / 2;
                margin += vector * 55 / 4;
            }
        }, 30);
    }

    // 敲击动作 img：被敲击的商标，isMy：是否是玩家主动敲击（否则是机器人）
    function tapDown(img, isMy) {
        if ((isMy && settings.mhitting) || gameStatus != gameStatusEnum.playing)
            return;
        var hammer = (!isMy) ? ohammer : mhammer;
        if (!isMy) {
            hammer.style.left = pageX(img) - mainLeft + 10 + "px";
            hammer.style.top = pageY(img) + 15 + "px";
            hammer.show();
        } else if (Jy.isMobile) {
            hammer.style.left = pageX(img) - mainLeft + 25 + "px";
            hammer.style.top = pageY(img) + 20 + "px";
            hammer.show();
        }
        var cls = "hright", isRight = img.hcls("lwrong"), effect;
        if (isRight) {
            gameStatus = gameStatusEnum.hitting;
            effect = rightEffect;
            if (Jy.fkIE) {
                effect.setAttribute("src", "./src/image/hieright.png");
            } else {
                effect.style.left = img.offsetLeft - 50 + "px";
                effect.style.top = img.offsetTop - 50 + "px";
                effect.show();
            }
            if (isMy) {
                mscoure += 1;
                Jy.music("hright")
            } else {
                oscore += 1;
            }
            var mevdom = Jo(isMy ? "mev" : "otv");
            var mev = mevdom.textContent || mevdom.innerText;
            Jy.st(mevdom, Number(mev) + 1).acls("addscore");
            window.setTimeout(function () {
                mevdom.mcls("addscore");
            }, settings.hHitTime);
        } else {
            cls = "hwrong";
            if (!Jy.fkIE) {
                effect = img;
            } else {
                effect = rightEffect;
                effect.setAttribute("src", "./src/image/hiewrong.png");
            }
            if (isMy) {
                settings.mhitting = true;
                Jy.music("hwrong");
                settings.leftStepTime -= defaults.wrongTime / 100;
                (settings.leftStepTime < 0) && (settings.leftStepTime = 0);
                var cuttime = Jo("progress-cutime");
                cuttime.show();
                if (Jy.fkIE) {
                    var time = 1, timmer = setInterval(function () {
                        if (time <= 8) {
                            cuttime.style.fontSize = (10 + 3.2 * time) + "px";
                        } else if (time > 16) {
                            clearInterval(timmer);
                            cuttime.style.fontSize = "10px";
                            cuttime.hide();
                        } else {
                            cuttime.style.fontSize = (10 + 3.2 * (16 - time)) + "px";
                        }
                        time++;
                    }, 30);
                } else {
                    cuttime.acls("addscore");
                    window.setTimeout(function () {
                        cuttime.hide().mcls("addscore");
                    }, settings.hHitTime);
                }
            }
        }
        if (!Jy.fkIE) {
            effect.acls(cls);
            hammerHit(hammer, null, function () {
                (!isMy || Jy.isMobile) && (hammer.hide());
                if (isRight) {
                    effect.hide();
                    newRound();
                } else if (isMy) {
                    window.setTimeout(function () {
                        settings.mhitting = false;
                    }, defaults.hitInter - settings.hHitTime);
                }
                effect.mcls(cls);
            }, isMy ? "mhit" : "ohit", true);
        } else {
            effect.show();
            img.appendChild(effect);
            hammerHit(hammer, null, function () {
                effect.hide();
                isMy || (hammer.hide());
                if (isRight) {
                    newRound();
                } else if (isMy) {
                    window.setTimeout(function () {
                        settings.mhitting = false;
                    }, defaults.hitInter - settings.hHitTime);
                }
            }, isMy ? "mhit" : "ohit", true);
        }
    }

    function hammerHit(hammer, midFunc, completeFunc, cls, noaudio) {
        cls = cls || "mhit";
        noaudio || Jy.music("hit");
        if (Jy.fkIE && cls == "ohit") {
            var angle = 0, time = 0;
            var top = parseInt(hammer.style.top), left = parseInt(hammer.style.left);
            var lightheight = hammer.offsetHeight, lightwidth = hammer.offsetWidth, hittimer = window.setInterval(
                function () {
                    if (time >= 5) {
                        angle -= Math.PI / 15;
                    } else {
                        angle += Math.PI / 15;
                    }
                    Jy.rotate(hammer, angle);
                    hammer.style.top = top - (hammer.offsetHeight - lightheight) / 2 + "px";
                    hammer.style.left = left - (hammer.offsetWidth - lightwidth) / 2 + "px";
                    if (time >= 10) {
                        clearInterval(hittimer);
                        hammer.style.top = top + "px";
                        hammer.style.left = left + "px";
                        completeFunc && completeFunc();
                    }
                    time++;
                }, 40);
        } else {
            hammer.acls(cls);
            window.setTimeout(function () {
                midFunc && midFunc();
                window.setTimeout(function () {
                    hammer.mcls(cls);
                    completeFunc && completeFunc();
                }, settings.hHitTime / 2);
            }, settings.hHitTime / 2);
        }
    }

    function gameOver() {
        clearInterval(settings.bartimeintervar);
        clearInterval(settings.brandtimeintervar);
        window.clearTimeout(settings.hittimeout);
        gameStatus = gameStatusEnum.end;
        Jy.music("gameover");
        if (Jy.fkIE) {
            var recoverybrands = Jy.jCls("ieflipped", Jo("brand-container"));
            for (var i = 0; i < recoverybrands.length; i++) {
                Jo(recoverybrands[i]).mcls("ieflipped").src = "./src/image/back.png";
                ;
                Jo(recoverybrands[i].parentNode).mcls("lwrong");
                recoverybrands[i].style.width = "100px";
            }
        } else {
            var recoverybrands = Jy.jCls("bra", Jo("brand-container"));
            for (var i = 0; i < recoverybrands.length; i++) {
                Jo(recoverybrands[i]).mcls("lwrong").acls("flipped");
            }
        }
        mhammer.hide();
        Jo("game-result").show();
        settings.flipArray = [];
        settings.wlogos = [];
        setTimeout(function () {
            gameStatus = gameStatusEnum.none;
        }, 1000);
    }

    Jy.aevt(Jo("brand-container"), "click", function (e) {
        if (gameStatus != gameStatusEnum.playing) {
            return;
        }
        var dom = Jo(e.target || e.srcElement || e.currentTarget);
        if ((!Jy.fkIE && dom.hcls("brand")) || (Jy.fkIE && dom.hcls("ieflipped"))) {
            if (Jy.fkIE) {
                tapDown(dom.parentNode, 1);
            } else {
                tapDown(dom.parentNode.parentNode, 1);
            }
        }
    }, true);
    Jy.aevt(Jo("start-game"), "click", function (e) {
        initGame();
    });
    Jy.aevt(Jo("restart-game"), "click", function (e) {
        initGame();
    });
    function pageX(elem) {
        if (elem)
            return elem.offsetParent ? (elem.offsetLeft + pageX(elem.offsetParent)) : elem.offsetLeft;
        return 0;
    }

    function pageY(elem) {
        if (elem)
            return elem.offsetParent ? (elem.offsetTop + pageY(elem.offsetParent)) : elem.offsetTop;
        return 0;
    }
})();
