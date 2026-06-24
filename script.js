// ============================================
// 页面加载完成后执行
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ============================================
    // 1. 导航栏滚动效果
    // ============================================
    const navbar = document.getElementById('navbar');
    const scrollProgress = document.querySelector('.scroll-progress');

    function handleScroll() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        // 导航栏透明 -> 磨砂玻璃
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 滚动进度条
        scrollProgress.style.setProperty('--progress', `${progress}%`);
        scrollProgress.querySelector('::after')?.remove();
        // 使用伪元素方式更新进度
        const style = document.createElement('style');
        style.id = 'progress-style';
        const existingStyle = document.getElementById('progress-style');
        if (existingStyle) existingStyle.remove();
        style.textContent = `.scroll-progress::after { height: ${progress}%; }`;
        document.head.appendChild(style);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================
    // 2. 昼夜模式切换
    // ============================================
    const themeToggle = document.getElementById('themeToggle');
    const themeDot = document.querySelector('.theme-dot');

    // 检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    let currentTheme = localStorage.getItem('theme') || (prefersDark.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // ============================================
    // 3. 轮播图功能
    // ============================================
    const track = document.getElementById('carouselTrack');
    const slides = track.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.dot');
    const currentIndexEl = document.getElementById('currentIndex');
    const totalCountEl = document.getElementById('totalCount');
    const viewport = document.getElementById('carouselViewport');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const carouselContainer = document.querySelector('.carousel-container');

    let currentIndex = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;
    let autoPlayTimer = null;
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragOffset = 0;

    // 设置总数
    totalCountEl.textContent = String(totalSlides).padStart(2, '0');

    // 预加载图片
    function preloadImages() {
        slides.forEach(slide => {
            const img = slide.querySelector('.slide-image');
            const bgUrl = img.style.backgroundImage;
            if (bgUrl) {
                const url = bgUrl.replace(/^url\(['"](.+)['"]\)$/, '$1');
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                document.head.appendChild(link);
            }
        });
    }
    preloadImages();

    // 更新轮播
    function updateCarousel(index, animate = true) {
        if (isTransitioning) return;
        isTransitioning = true;

        // 边界限制
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;

        // 移动track
        const offset = -currentIndex * 100;
        track.style.transition = animate ? 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
        track.style.transform = `translateX(${offset}%)`;

        // 更新active状态
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentIndex);
        });

        // 更新指示器
        currentIndexEl.textContent = String(currentIndex + 1).padStart(2, '0');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });

        setTimeout(() => {
            isTransitioning = false;
        }, 700);
    }

    // 下一张
    function nextSlide() {
        updateCarousel(currentIndex + 1);
        resetAutoPlay();
    }

    // 上一张
    function prevSlide() {
        updateCarousel(currentIndex - 1);
        resetAutoPlay();
    }

    // 自动播放
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    // 事件绑定
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // 圆点点击
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateCarousel(index);
            resetAutoPlay();
        });
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'Escape') exitFullscreen();
    });

    // ============================================
    // 4. 鼠标拖拽滑动
    // ============================================
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragOffset = 0;
        viewport.style.cursor = 'grabbing';
        stopAutoPlay();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        dragOffset = e.clientX - dragStartX;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        viewport.style.cursor = 'grab';

        if (Math.abs(dragOffset) > 80) {
            if (dragOffset < 0) nextSlide();
            else prevSlide();
        } else {
            startAutoPlay();
        }
        dragOffset = 0;
    });

    // ============================================
    // 5. 触摸滑动（移动端）
    // ============================================
    viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        } else {
            startAutoPlay();
        }
    }, { passive: true });

    // ============================================
    // 6. 全屏浏览
    // ============================================
    function enterFullscreen() {
        carouselContainer.classList.add('fullscreen');
        document.body.style.overflow = 'hidden';
        stopAutoPlay();
    }

    function exitFullscreen() {
        carouselContainer.classList.remove('fullscreen');
        document.body.style.overflow = '';
        startAutoPlay();
    }

    fullscreenBtn.addEventListener('click', () => {
        if (carouselContainer.classList.contains('fullscreen')) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    });

    // 点击全屏背景退出
    carouselContainer.addEventListener('click', (e) => {
        if (carouselContainer.classList.contains('fullscreen') && e.target === carouselContainer) {
            exitFullscreen();
        }
    });

    // ============================================
    // 7. 初始化轮播
    // ============================================
    updateCarousel(0, false);
    startAutoPlay();

    // ============================================
    // 8. 汉堡菜单（移动端）
    // ============================================
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    // 创建遮罩
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
        overlay.classList.toggle('show');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    }

    function closeMenu() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // 点击导航链接关闭菜单
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // ============================================
    // 9. 微信公众号复制功能
    // ============================================
    const copyBtn = document.getElementById('copyWechatBtn');
    const toast = document.getElementById('toast');
    let toastTimer = null;

    copyBtn.addEventListener('click', () => {
        // 复制公众号ID到剪贴板
        const wechatId = 'Lens灵感集';
        navigator.clipboard.writeText(wechatId).catch(() => {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = wechatId;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });

        // 显示Toast
        showToast('公众号ID已复制，打开微信搜索关注');

        // 尝试跳转微信（在微信内置浏览器中有效）
        const isWechat = navigator.userAgent.toLowerCase().includes('micromessenger');
        if (isWechat) {
            setTimeout(() => {
                window.location.href = 'weixin://';
            }, 1500);
        }
    });

    function showToast(message) {
        const toastMessage = toast.querySelector('.toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============================================
    // 10. Logo点击回到顶部
    // ============================================
    document.getElementById('logo').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ============================================
    // 11. 图片懒加载（Intersection Observer）
    // ============================================
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const slide = entry.target;
                    const img = slide.querySelector('.slide-image');
                    if (img && img.style.backgroundImage) {
                        // 图片已通过预加载处理
                    }
                    imageObserver.unobserve(slide);
                }
            });
        }, { rootMargin: '200px' });

        slides.forEach(slide => imageObserver.observe(slide));
    }

    // ============================================
    // 12. 窗口resize处理
    // ============================================
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // 重新计算轮播位置
            const offset = -currentIndex * 100;
            track.style.transition = 'none';
            track.style.transform = `translateX(${offset}%)`;
            // 强制回流后恢复过渡
            track.offsetHeight;
            track.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 200);
    });

    // ============================================
    // 13. 页面可见性变化时暂停/恢复自动播放
    // ============================================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoPlay();
        } else {
            if (!carouselContainer.classList.contains('fullscreen')) {
                startAutoPlay();
            }
        }
    });

    console.log('✨ 页面已加载完成');
    console.log('📸 欢迎来到 Lens 的个人作品集');
});
