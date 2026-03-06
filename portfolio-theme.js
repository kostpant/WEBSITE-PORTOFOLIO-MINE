(function applyPortfolioConfig() {
    // 1. Try LocalStorage for small configs (Synchronous)
    try {
        var preview = localStorage.getItem('portfolio_preview');
        if (preview) {
            window.PORTFOLIO_CONFIG = JSON.parse(preview);
        }
    } catch (e) { }

    // 2. Try IndexedDB for large configs (Asynchronous)
    const DB_NAME = 'PortfolioEditorDB';
    const STORE_NAME = 'editorState';
    if (window.indexedDB) {
        var openReq = indexedDB.open(DB_NAME, 1);
        openReq.onsuccess = function (e) {
            var db = e.target.result;
            if (db.objectStoreNames.contains(STORE_NAME)) {
                var tx = db.transaction(STORE_NAME, 'readonly');
                var getReq = tx.objectStore(STORE_NAME).get('previewState');
                getReq.onsuccess = function () {
                    if (getReq.result) {
                        console.log("🟢 Loaded preview from IndexedDB");
                        window.PORTFOLIO_CONFIG = getReq.result;
                        // Since this is async, we re-apply to ensure the UI updates
                        // if it already finished the initial domestic load.
                        applyConfigToDOM();
                    }
                };
            }
        };
    }

    var cfg = window.PORTFOLIO_CONFIG;
    if (!cfg) return;

    /* ── SEO / Meta ─────────────────────────────────── */
    if (cfg.metaTitle) {
        document.title = cfg.metaTitle;
        ['og:title', 'twitter:title'].forEach(function (n) {
            var m = document.querySelector('meta[property="' + n + '"]');
            if (m) m.setAttribute('content', cfg.metaTitle);
        });
    }
    if (cfg.metaDescription) {
        ['description', 'og:description', 'twitter:description'].forEach(function (n) {
            var m = document.querySelector('meta[name="' + n + '"],[property="' + n + '"]');
            if (m) m.setAttribute('content', cfg.metaDescription);
        });
    }
    if (cfg.metaImage) {
        ['og:image', 'twitter:image'].forEach(function (n) {
            var m = document.querySelector('meta[property="' + n + '"]');
            if (m) m.setAttribute('content', cfg.metaImage);
        });
    }
    if (cfg.canonicalUrl) {
        var c = document.querySelector('link[rel="canonical"]');
        if (c) c.setAttribute('href', cfg.canonicalUrl);
    }

    /* ── DOM Manipulation Logic ─────────────────────── */
    function applyConfigToDOM() {
        var cfg = window.PORTFOLIO_CONFIG;
        if (!cfg) return;

        /* ── Name ──────────────────────────────────────── */
        if (cfg.name) {
            document.querySelectorAll('h1').forEach(function (el) {
                if (el.textContent.indexOf('Dennis Snellenberg') !== -1 || el.textContent.indexOf('Dennis') !== -1 && el.textContent.indexOf('Let\'s start') === -1) {
                    el.innerHTML = cfg.name + '<span class="spacer">—</span>';
                }
            });
            /* top-left nav credit */
            var dennis = document.querySelector('.dennis-span');
            if (dennis) dennis.textContent = cfg.nameEn || cfg.name;
            var snellenb = document.querySelector('.snellenberg');
            if (snellenb) snellenb.textContent = '';
        }

        /* ── Role / tagline ────────────────────────────── */
        if (cfg.role || cfg.tagline) {
            var h4 = document.querySelector('header .flex-col h4');
            if (h4) {
                h4.innerHTML = '<span>' + (cfg.role || '') + '</span>';
            }
        }
        if (cfg.tagline) {
            var introH4 = document.querySelector('.home-intro h4.span-lines');
            if (introH4) introH4.textContent = cfg.tagline;
        }
        if (cfg.bio) {
            var bioPara = document.querySelector('.home-intro .text-wrap p');
            if (bioPara) bioPara.textContent = cfg.bio;
        }

        /* ── Location ──────────────────────────────────── */
        if (cfg.location) {
            var locSpans = document.querySelectorAll('.hanger p span');
            if (locSpans.length >= 3) {
                locSpans[0].textContent = 'Located';
                locSpans[1].textContent = 'in';
                locSpans[2].textContent = cfg.location;
            }
        }

        /* ── Hero photo ────────────────────────────────── */
        if (cfg.heroPhoto) {
            var heroImg = document.querySelector('.personal-image img');
            if (heroImg) heroImg.src = cfg.heroPhoto;
        }

        /* ── Profile picture (footer circle) ──────────── */
        if (cfg.profilePicture) {
            var pp = document.querySelector('.profile-picture');
            if (pp) {
                pp.style.backgroundImage = 'url(' + cfg.profilePicture + ')';
                pp.style.backgroundSize = 'cover';
                pp.style.backgroundPosition = 'center';
            }
        }

        /* ── Email & phone ─────────────────────────────── */
        if (cfg.email) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
                a.href = 'mailto:' + cfg.email;
                var inner = a.querySelector('.btn-text-inner');
                if (inner) inner.textContent = cfg.email;
            });
        }
        if (cfg.phone) {
            document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
                a.href = 'tel:' + cfg.phone.replace(/\s/g, '');
                var inner = a.querySelector('.btn-text-inner');
                if (inner) inner.textContent = cfg.phone;
            });
        }

        /* ── Social links ──────────────────────────────── */
        if (cfg.socials) {
            var map = {
                'Instagram': cfg.socials.instagram,
                'Twitter': cfg.socials.twitter,
                'LinkedIn': cfg.socials.linkedin,
                'Awwwards': cfg.socials.github || cfg.socials.instagram,
            };
            document.querySelectorAll('a.btn-click').forEach(function (a) {
                var inner = a.querySelector('.btn-text-inner');
                if (!inner) return;
                var label = inner.textContent.trim();
                if (map[label] && map[label] !== '') {
                    a.href = map[label];
                    if (label === 'Awwwards' && cfg.socials.github) {
                        inner.textContent = 'GitHub';
                        a.href = cfg.socials.github;
                    }
                }
            });
        }

        /* ── Projects ──────────────────────────────────── */
        if (cfg.projects && cfg.projects.length) {
            /* Work list (big list with stripes) */
            var listItems = document.querySelectorAll('.work-grid ul.work-items > li');
            /* Work tiles (card grid below the list) */
            var tileItems = document.querySelectorAll('.work-tiles ul > li');
            /* Hover preview images */
            var hoverImgs = document.querySelectorAll('.float-image-wrap li');

            cfg.projects.forEach(function (proj, i) {
                /* List row */
                if (listItems[i]) {
                    var aEl = listItems[i].querySelector('a');
                    if (aEl) aEl.href = proj.url || '#';
                    var titleEl = listItems[i].querySelector('h4 span');
                    if (titleEl) titleEl.textContent = proj.title;
                    var catEl = listItems[i].querySelector('.flex-col.animate p');
                    if (catEl) catEl.textContent = proj.category || '';
                }
                /* Tile card */
                if (tileItems[i]) {
                    var aT = tileItems[i].querySelector('a');
                    if (aT) aT.href = proj.url || '#';
                    var titleT = tileItems[i].querySelector('h4 span');
                    if (titleT) titleT.textContent = proj.title;
                    var catT = tileItems[i].querySelectorAll('.flex-col p');
                    if (catT[0]) catT[0].textContent = proj.category || '';
                    if (catT[1]) catT[1].textContent = proj.year || '';
                    var imgDiv = tileItems[i].querySelector('.overlay-image');
                    if (imgDiv) {
                        if (proj.thumbnail) imgDiv.setAttribute('data-bg', proj.thumbnail);
                        if (proj.thumbnailBg) imgDiv.style.backgroundColor = proj.thumbnailBg;
                    }
                }
                /* Hover image */
                if (hoverImgs[i]) {
                    var hImgDiv = hoverImgs[i].querySelector('.overlay-image');
                    if (hImgDiv) {
                        if (proj.thumbnail) hImgDiv.setAttribute('data-bg', proj.thumbnail);
                        if (proj.thumbnailBg) hImgDiv.style.backgroundColor = proj.thumbnailBg;
                    }
                }
            });
        }

        /* ── Gallery (horizontal scroll) ───────────────── */
        if (cfg.gallery && cfg.gallery.length) {
            var imgSlots = document.querySelectorAll('.horizontal-items .overlay.lazy:not(video)');
            var vidSlots = document.querySelectorAll('.horizontal-items video.overlay.lazy');
            var imgIdx = 0, vidIdx = 0;
            cfg.gallery.forEach(function (item) {
                if (!item) return;
                if (item.type === 'image' && imgSlots[imgIdx]) {
                    imgSlots[imgIdx].setAttribute('data-bg', item.src);
                    imgSlots[imgIdx].style.backgroundImage = 'url(' + item.src + ')';
                    imgIdx++;
                } else if (item.type === 'video' && vidSlots[vidIdx]) {
                    vidSlots[vidIdx].src = item.src;
                    vidIdx++;
                }
            });
        }

        /* ── About Page Texts & Photo ──────────────────── */
        if (cfg.aboutTitle) {
            document.querySelectorAll('h1').forEach(function (h1) {
                if (h1.textContent.indexOf('Helping brands thrive') !== -1) {
                    h1.innerHTML = '<span>' + cfg.aboutTitle + '</span>';
                }
            });
        }
        if (cfg.aboutDescription) {
            var pDesc = document.querySelector('.about-image p[data-scroll]');
            if (pDesc) pDesc.textContent = cfg.aboutDescription;
        }
        if (cfg.aboutPhoto) {
            var abtImg = document.querySelector('.single-about-image .overlay-image');
            if (abtImg) {
                abtImg.setAttribute('data-bg', cfg.aboutPhoto);
                abtImg.style.backgroundImage = 'url(' + cfg.aboutPhoto + ')';
            }
        }
        if (cfg.services && cfg.services.length === 3) {
            var sCols = document.querySelectorAll('.about-services .row:nth-child(2) .flex-col');
            if (sCols.length >= 3) {
                // Service 1
                var h4_1 = sCols[0].querySelector('h4');
                var p_1 = sCols[0].querySelector('p');
                if (h4_1) h4_1.textContent = cfg.services[0].title;
                if (p_1) p_1.textContent = cfg.services[0].desc;
                // Service 2
                var h4_2 = sCols[1].querySelector('h4');
                var p_2 = sCols[1].querySelector('p');
                if (h4_2) h4_2.textContent = cfg.services[1].title;
                if (p_2) p_2.textContent = cfg.services[1].desc;
                // Service 3
                var h4_3 = sCols[2].querySelector('h4');
                var p_3 = sCols[2].querySelector('p');
                if (h4_3 && h4_3.childNodes.length > 1) {
                    h4_3.childNodes[h4_3.childNodes.length - 1].nodeValue = cfg.services[2].title;
                } else if (h4_3) {
                    h4_3.textContent = cfg.services[2].title;
                }
                if (p_3) p_3.textContent = cfg.services[2].desc;
            }
        }
        if (cfg.awardsTitle) {
            var awTitle = document.querySelector('.about-awwwards h2');
            if (awTitle) awTitle.innerHTML = cfg.awardsTitle.replace(/\\n/g, '<br>'); // Allow manual breaks maybe, or just replace
        }
        if (cfg.awardsDesc) {
            var awDesc = document.querySelector('.about-awwwards p');
            if (awDesc) awDesc.textContent = cfg.awardsDesc;
        }

        /* ── Contact Details / Business Info ───────────── */
        if (cfg.contactTitle) {
            // Keep the profile picture in the headline
            document.querySelectorAll('h1').forEach(function (h1) {
                if (h1.textContent.indexOf("Let's start a") !== -1 || h1.textContent.indexOf(cfg.contactTitle) !== -1) {
                    // Inject a span or just text with profile picture
                    h1.innerHTML = '<span><div class="profile-picture"' + (cfg.profilePicture ? ' style="background-image:url(' + cfg.profilePicture + '); background-size:cover; background-position:center;"' : '') + '></div> ' + cfg.contactTitle + '</span>';
                }
            });
            // Update the footer version too (the huge one at the bottom)
            var ftTitle = document.querySelector('footer.footer-contact h2');
            if (ftTitle) {
                ftTitle.innerHTML = '<span><div class="profile-picture"' + (cfg.profilePicture ? ' style="background-image:url(' + cfg.profilePicture + '); background-size:cover; background-position:center;"' : '') + '></div> ' + cfg.contactTitle + '</span>';
            }
        }

        var businessDetailsHeader = Array.from(document.querySelectorAll('h5')).find(el => el.textContent === 'Business Details');
        if (businessDetailsHeader && businessDetailsHeader.nextElementSibling) {
            var bList = businessDetailsHeader.nextElementSibling.querySelectorAll('p');
            if (bList.length >= 4) {
                if (cfg.businessName) bList[0].textContent = cfg.businessName;
                if (cfg.businessCoc) bList[1].textContent = 'CoC: ' + cfg.businessCoc;
                if (cfg.businessVat) bList[2].textContent = 'VAT: ' + cfg.businessVat;
                if (cfg.businessLocation) bList[3].textContent = 'Location: ' + cfg.businessLocation;
            }
        }
    }

    /* ── Footer Realtime Clock & Year ───────────────── */
    var timeSpanReplaced = false;

    function updateFooterClock() {
        var timeSpan = document.getElementById('timeSpan');
        if (!timeSpan) return;

        if (!timeSpanReplaced) {
            var clone = timeSpan.cloneNode(true);
            timeSpan.parentNode.replaceChild(clone, timeSpan);
            timeSpan = clone;
            timeSpanReplaced = true;
        }

        var options = { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
        try {
            timeSpan.textContent = new Intl.DateTimeFormat('en-US', options).format(new Date());
        } catch (e) {
            // Fallback if Intl is acting up
            timeSpan.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (GR)';
        }

        var versionHeaders = Array.from(document.querySelectorAll('h5')).filter(function (el) { return el.textContent.trim() === 'Version'; });
        versionHeaders.forEach(function (el) {
            if (el.nextElementSibling) {
                el.nextElementSibling.textContent = new Date().getFullYear() + ' © Edition';
            }
        });
    }

    // Start clock loop independently of the Barba transitions
    updateFooterClock();
    setInterval(updateFooterClock, 1000);

    /* ── Execution & Observer ───────────────────────── */
    // 1. Run immediately when DOM is ready
    document.addEventListener('DOMContentLoaded', applyConfigToDOM);

    // 2. Observe changes for Barba.js transitions
    var observer = new MutationObserver(function (mutations) {
        var shouldApply = false;
        mutations.forEach(function (m) {
            if (m.addedNodes && m.addedNodes.length > 0) {
                for (var i = 0; i < m.addedNodes.length; i++) {
                    var node = m.addedNodes[i];
                    if (node.nodeType === 1) { // Element node
                        if (node.getAttribute('data-barba') === 'container' || node.querySelector('[data-barba="container"]')) {
                            shouldApply = true;
                        }
                    }
                }
            }
        });
        if (shouldApply) {
            // Apply config to the new DOM nodes
            setTimeout(applyConfigToDOM, 50);
        }
    });

    // Start observing the body for new pages loaded via AJAX
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

})();
