/* =========================================================== *
 * @site http://tt-cc.cc
 * @email ttccmvp@gmail.com
 * Copyright 2016 ttcc
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
(function () {
    FastClick.attach(document.body);
    Element.prototype.show = function () {
        this.style.display = "block";
        return this;
    };
    Element.prototype.hide = function () {
        this.style.display = "none";
        return this;
    };
    window.Jo = function (id) {
        var ele = (id.nodeType) ? id : document.getElementById(id);
        ele.hcls = function (a) {
            return new RegExp("(?:^|\\s+)" + a + "(?:\\s+|$)").test(this.className);
        };
        ele.acls = function (a) {
            if (!this.hcls(a)) {
                this.className = [this.className, a].join(" ");
            }
            return this;
        };
        ele.mcls = function (b) {
            if (this.hcls(b)) {
                var a = ele.className;
                this.className = a.replace(new RegExp("(?:^|\\s+)" + b + "(?:\\s+|$)", "g"), " ");
            }
            return this;
        };
        return ele;
    };
    window.Jy = {};
    Jy = {
        jCls: function (searchClass, node) {
            node = node || document;
            if (!this.low9IE) {
                return node.getElementsByClassName(searchClass);
            }
            var classElements = [];
            var els = node.getElementsByTagName('*');
            var elsLen = els.length;
            var pattern = new RegExp("(^|\\s)" + searchClass + "(\\s|$)");
            for (var i = 0, j = 0; i < elsLen; i++) {
                if (pattern.test(els[i].className)) {
                    classElements[j] = els[i];
                    j++;
                }
            }
            return classElements;
        },
        aevt: function (o, s, fn) {
            o.addEventListener(s, fn, false);
        },
        ajax: function (url, ok, error, notloading) {
            url += "&sid=" + Jo("joysid").value;
            var loading = Jo("loading"), that = this;
            var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4) {
                    if ((xmlhttp.status >= 200 && xmlhttp.status < 300) || xmlhttp.status == 304) {
                        var json = (new Function("return " + xmlhttp.responseText))();
                        if (json.success) {
                            !notloading && (loading.hide());
                            ok && ok(json);
                        } else {
                            if (json.errorMessage) {
                                loading.hide();
                                that.msg(json.errorMessage);
                            } else if (!json.isLogin) {
                                Jy.msg("Joy英雄，貌似你还木有登录哦~");
                                setTimeout(function () {
                                    var url = (window.location != window.parent.location)
                                        ? document.referrer
                                        : document.location;
                                    window.open((json.url || "") + url, "_top");
                                }, 1000);
                            }
                        }
                    } else {
                        loading.hide();
                        Jy.msg("Joy英雄，请刷新试试呢~");
                    }
                } else if (xmlhttp.readyState == 1 && !notloading) {
                    loading.show();
                } else if (!notloading) {
                    loading.hide();
                }
            };
            xmlhttp.open("POST", url, true);
            xmlhttp.send();
        },
        msg: function (msg) {
            Jo("msg").innerHTML = msg;
            var msgdom = Jo("message"), that = this;
            msgdom.show();
            this.aevt(msgdom, "click", function (e) {
                var newurl = (window.location != window.parent.location)
                    ? document.referrer
                    : document.location;
                that.open(newurl);
            });
        },
        loadingmsg: function (msg) {
            Jo("loading_msg").innerHTML = msg;
        },
        open: function (url) {
            if (!url)
                return;
            window.open(url, "_top");
        },
        pimgs: function (arr) {
            var newimages = [];
            var arr = (typeof arr != "object") ? [arr] : arr;
            for (var i = 0; i < arr.length; i++) {
                newimages[i] = new Image();
                newimages[i].src = arr[i];
            }
        },
        rd: function (n, m, isint) {
            var c = m - n;
            return isint ? (Math.floor(Math.random() * (c + 1) + n)) : (Math.random() * c.toFixed(3) + n);
        },
        cookie: function (key) {
            var result;
            return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie))
                ? decodeURIComponent(result[1])
                : null;
        }
    };
})();
