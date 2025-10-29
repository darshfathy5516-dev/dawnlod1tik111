document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tiktok-form');
    const urlInput = document.getElementById('tiktok-url');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results');
    const adOverlay = document.getElementById('ad-overlay');
    const downloadNowBtn = document.getElementById('download-now-btn');
    const adAboveResults = document.getElementById('adsense-above-results');
    const themeToggleFab = document.getElementById('theme-toggle-fab');
    const scrollToTopFab = document.getElementById('scroll-to-top-fab');
    const menuToggle = document.getElementById('menu-toggle');
    const headerNav = document.getElementById('header-nav');
    const preDownloadOverlay = document.getElementById('pre-download-overlay');
    const preDownloadContinueBtn = document.getElementById('pre-download-continue-btn');
    const allCloseButtons = document.querySelectorAll('.close-overlay-btn');

    let preDownloadInterval;
    let downloadAdInterval;

    menuToggle.addEventListener('click', () => {
        headerNav.classList.toggle('active');
        document.body.classList.toggle('nav-open');
    });

    const applyTheme = (theme) => document.documentElement.className = theme;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(currentTheme);
    themeToggleFab.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
    });

    window.addEventListener('scroll', () => {
        scrollToTopFab.classList.toggle('fab-hidden', window.scrollY <= 300);
    });
    scrollToTopFab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    allCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('#pre-download-overlay, #ad-overlay').hidden = true;
            if (preDownloadInterval) clearInterval(preDownloadInterval);
            if (downloadAdInterval) clearInterval(downloadAdInterval);
        });
    });

    function performDownload(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }).catch(() => showError('Download failed. Please check your connection and try again.'));
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tiktokUrl = urlInput.value.trim();
        if (!tiktokUrl) return showError('Please paste a valid TikTok URL.');

        preDownloadOverlay.hidden = false;
        let countdown = 5;
        preDownloadContinueBtn.textContent = `Continue in ${countdown}s`;
        preDownloadContinueBtn.disabled = true;

        if (preDownloadInterval) clearInterval(preDownloadInterval);
        preDownloadInterval = setInterval(() => {
            countdown--;
            preDownloadContinueBtn.textContent = `Continue in ${countdown}s`;
            if (countdown <= 0) {
                clearInterval(preDownloadInterval);
                preDownloadContinueBtn.disabled = false;
                preDownloadContinueBtn.textContent = 'Continue';
            }
        }, 1000);

        preDownloadContinueBtn.onclick = () => {
            preDownloadOverlay.hidden = true;
            fetchAndDisplayResults(tiktokUrl);
        };
    });

    async function fetchAndDisplayResults(tiktokUrl) {
        setLoadingState(true);
        hideStatus();
        try {
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            const data = await response.json();
            if (data.code !== 0) throw new Error(data.msg || 'Could not fetch video. It might be private or an invalid link.');
            displayResults(data.data);
            document.getElementById('status-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading ? '<div class="spinner"></div><span>Processing...</span>' : '<span>Download</span>';
    }

    function hideStatus() {
        errorMessage.hidden = true;
        resultsContainer.innerHTML = '';
        adAboveResults.hidden = true;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.hidden = false;
    }

    function triggerDownloadAd(downloadUrl, filename) {
        adOverlay.hidden = false;
        let countdown = 5;
        downloadNowBtn.textContent = `Download in ${countdown}s`;
        downloadNowBtn.disabled = true;

        if (downloadAdInterval) clearInterval(downloadAdInterval);
        downloadAdInterval = setInterval(() => {
            countdown--;
            downloadNowBtn.textContent = `Download in ${countdown}s`;
            if (countdown <= 0) {
                clearInterval(downloadAdInterval);
                downloadNowBtn.disabled = false;
                downloadNowBtn.textContent = 'Download Now';
            }
        }, 1000);

        downloadNowBtn.onclick = () => {
            adOverlay.hidden = true;
            performDownload(downloadUrl, filename);
        };
    }

    function displayResults(data) {
        adAboveResults.hidden = false;
        const sanitizedTitle = (data.title || 'tiktok_video').replace(/[^\p{L}\p{N}\s-]/gu, '').substring(0, 50);
        const videoFilename = `@${data.author.unique_id}-${sanitizedTitle}.mp4`;
        const audioFilename = `@${data.author.unique_id}-${(data.music_info.title || 'audio').replace(/[^\p{L}\p{N}\s-]/gu, '')}.mp3`;

        resultsContainer.innerHTML = `
            <article class="glass-card">
                <div class="author-info">
                    <img src="${data.author.avatar}" alt="${data.author.nickname}'s avatar" loading="lazy">
                    <div>
                        <p class="author-nickname">${data.author.nickname}</p>
                        <p class="author-unique-id">@${data.author.unique_id}</p>
                    </div>
                </div>
                ${data.title ? `<p class="video-title" style="margin-top: 1rem;">${data.title}</p>` : ''}
                <div class="download-buttons-container">
                    <button data-url="${data.play}" data-filename="${videoFilename}" class="download-btn-large">📥 Download Video (MP4)</button>
                    <button data-url="${data.music}" data-filename="${audioFilename}" class="download-btn-large audio">🎵 Download Audio (MP3)</button>
                    ${data.hdplay ? `<button data-url="${data.hdplay}" data-filename="${videoFilename}" class="download-btn-large ad">🔥 Download HD Video</button>` : ''}
                </div>
            </article>`;

        resultsContainer.querySelectorAll('.download-btn-large').forEach(button => {
            button.addEventListener('click', (e) => {
                const { url, filename } = e.currentTarget.dataset;
                triggerDownloadAd(url, filename);
            });
        });
    }
});
