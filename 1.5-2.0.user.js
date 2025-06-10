// ==UserScript==
// @name         1.5
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  当视频进度条完成时自动进入下一课时视频播放
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const config = {
        videoSelector: 'video[preload="preload"]', // 视频元素选择器
        lessonListSelector: '.list', // 课时列表容器
        currentLessonSelector: '.list > a.on', // 当前课时选择器
        nextLessonSelector: '.list > a.on + a', // 下一课时选择器
        playbackRate: 1.5, // 默认播放速度
        delayBeforePlay: 2000, // 切换到下一课时后的延迟播放时间
        debugMode: true // 调试模式
    };

    // 日志函数
    function log(message) {
        if (config.debugMode) {
            console.log(`[自动下一课时] ${message}`);
        }
    }

    // 查找视频元素
    function findVideoElement() {
        const video = document.querySelector(config.videoSelector);
        if (video) {
            log('找到视频元素');
            return video;
        }
        log('未找到视频元素');
        return null;
    }

    // 查找下一课时元素
    function findNextLesson() {
        const currentLesson = document.querySelector(config.currentLessonSelector);
        if (!currentLesson) {
            log('未找到当前课时');
            return null;
        }

        const nextLesson = currentLesson.nextElementSibling;
        if (nextLesson && nextLesson.tagName === 'A') {
            log(`找到下一课时: ${nextLesson.textContent.trim()}`);
            return nextLesson;
        }

        log('已经是最后一个课时');
        return null;
    }

    // 切换到下一课时
    function goToNextLesson() {
        log('视频播放结束，准备切换到下一课时');

        const nextLesson = findNextLesson();
        if (!nextLesson) return;

        // 点击下一课时
        nextLesson.click();
        log('已点击下一课时');

        // 延迟后尝试播放新视频
        setTimeout(() => {
            setTimeout(() => {
                const newVideo = findVideoElement();
                if (newVideo) {
                    try {
                        // 设置播放速度
                        newVideo.playbackRate = config.playbackRate;
                        log(`设置播放速度为${config.playbackRate}倍`);

                        // 尝试播放
                        const playPromise = newVideo.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                log('成功播放下一课时的视频');
                            }).catch(error => {
                                log(`自动播放失败: ${error}`);
                                // 如果自动播放失败，尝试静音播放
                                newVideo.muted = true;
                                newVideo.play().then(() => {
                                    log('静音播放成功');
                                }).catch(e => log(`静音播放失败: ${e}`));
                            });
                        }
                    } catch (e) {
                        log(`播放异常: ${e.message}`);
                    }
                }
            }, 300);
        }, config.delayBeforePlay);
    }

    // 监听视频结束事件
    function setupVideoEndListener() {
        const video = findVideoElement();
        if (!video) return;

        // 移除旧的事件监听器（如果有）
        video.removeEventListener('ended', goToNextLesson);

        // 添加新的事件监听器
        video.addEventListener('ended', goToNextLesson);
        log('已添加视频结束事件监听器');

        // 添加播放状态显示
        const timeDisplay = document.querySelector('.prism-time-display');
        if (timeDisplay && !document.getElementById('auto-next-status')) {
            const statusDisplay = document.createElement('div');
            statusDisplay.id = 'auto-next-status';
            statusDisplay.innerHTML = '自动下一课时: <span style="color:#4caf50;">已启用</span>';
            statusDisplay.style.cssText = `
                position: absolute;
                bottom: 100px;
                left: 20px;
                background: rgba(0,0,0,0.7);
                color: #fff;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
            `;
            timeDisplay.parentElement.appendChild(statusDisplay);
        }
    }

    // 主初始化函数
    function init() {
        log('脚本初始化');

        // 初始设置视频监听
        setupVideoEndListener();

        // 监听DOM变化，以便在新视频加载时重新绑定事件
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // 检查是否添加了新的视频元素
                    const addedNodes = Array.from(mutation.addedNodes);
                    const videoAdded = addedNodes.some(node =>
                        node.nodeName === 'VIDEO' ||
                        (node.querySelector && node.querySelector(config.videoSelector))
                    );

                    if (videoAdded) {
                        log('检测到新视频元素，重新绑定事件');
                        setTimeout(setupVideoEndListener, 500);
                    }
                }
            }
        });

        // 开始观察整个文档
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('已启动DOM变化监听器');
    }

    // 等待页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 添加自定义样式
    const style = document.createElement('style');
    style.innerHTML = `
        #auto-next-status {
            position: absolute;
            bottom: 100px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        }

        .lesson-item:hover {
            background-color: rgba(255,255,255,0.1) !important;
        }
    `;
    document.head.appendChild(style);
})();