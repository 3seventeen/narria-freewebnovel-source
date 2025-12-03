var NovelSource = {
    baseUrl: "https://freewebnovel.com",
    
    _cleanText: function(text) {
        if (!text) return "";
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    },
    
    _buildUrl: function(path) {
        if (!path) return this.baseUrl;
        if (path.indexOf('http') === 0) return path;
        if (path.charAt(0) === '/') return this.baseUrl + path;
        return this.baseUrl + '/' + path;
    },
    
    getPopularNovels: function(page) {
        try {
            log("=== getPopularNovels START ===");
            log("Page: " + page);
            
            var url = this._buildUrl("/sort/latest-release");
            log("Fetching URL: " + url);
            
            var response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response) {
                log("ERROR: fetch returned null");
                throw new Error("Fetch failed");
            }
            
            if (!response.ok) {
                log("ERROR: HTTP status not OK: " + response.status);
                throw new Error("HTTP " + response.status);
            }
            
            var html = response.text;
            log("Got HTML, length: " + html.length);
            
            var novels = [];
            var seen = {};
            var startPos = 0;
            var maxIterations = 1000;
            var iterations = 0;
            
            while (startPos < html.length && novels.length < 20 && iterations < maxIterations) {
                iterations++;
                
                var linkStart = html.indexOf('href="/novel/', startPos);
                if (linkStart === -1) {
                    log("No more novel links found");
                    break;
                }
                
                var linkEnd = html.indexOf('"', linkStart + 6);
                if (linkEnd === -1) break;
                
                var novelPath = html.substring(linkStart + 6, linkEnd);
                var novelId = novelPath.replace('/novel/', '');
                
                if (seen[novelId]) {
                    startPos = linkEnd + 1;
                    continue;
                }
                
                if (novelId.indexOf('/') !== -1) {
                    startPos = linkEnd + 1;
                    continue;
                }
                
                seen[novelId] = true;
                
                var title = "";
                var titleStart = html.indexOf('title="', linkEnd);
                if (titleStart !== -1 && titleStart < linkEnd + 200) {
                    var titleEnd = html.indexOf('"', titleStart + 7);
                    if (titleEnd !== -1) {
                        title = html.substring(titleStart + 7, titleEnd);
                        title = this._cleanText(title);
                    }
                }
                
                if (!title || title.length === 0) {
                    title = novelId.split('-').join(' ');
                    title = title.charAt(0).toUpperCase() + title.slice(1);
                }
                
                var coverUrl = "";
                var contextStart = Math.max(0, linkStart - 500);
                var contextEnd = Math.min(html.length, linkStart + 500);
                var context = html.substring(contextStart, contextEnd);
                
                var imgStart = context.indexOf('src="');
                if (imgStart !== -1) {
                    var imgEnd = context.indexOf('"', imgStart + 5);
                    if (imgEnd !== -1) {
                        coverUrl = context.substring(imgStart + 5, imgEnd);
                        if (coverUrl.indexOf('http') !== 0 && coverUrl.length > 0) {
                            coverUrl = this._buildUrl(coverUrl);
                        }
                    }
                }
                
                var novel = {
                    novelId: novelId,
                    title: title,
                    author: "Unknown",
                    description: "",
                    coverUrl: coverUrl
                };
                
                novels.push(novel);
                log("Novel " + novels.length + ": " + title + " [" + novelId + "]");
                
                startPos = linkEnd + 1;
            }
            
            log("Total novels found: " + novels.length);
            
            if (novels.length === 0) {
                log("ERROR: No novels parsed from HTML");
                throw new Error("No novels found");
            }
            
            log("=== getPopularNovels END ===");
            return novels;
            
        } catch (e) {
            log("EXCEPTION in getPopularNovels: " + e.message);
            log("Stack: " + (e.stack || "no stack"));
            throw e;
        }
    },
    
    searchNovels: function(query, page) {
        try {
            log("=== searchNovels START ===");
            log("Query: " + query + ", Page: " + page);
            
            var searchUrl = this._buildUrl("/search/" + encodeURIComponent(query));
            log("Search URL: " + searchUrl);
            
            var response = fetch(searchUrl, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response || !response.ok) {
                throw new Error("Search fetch failed");
            }
            
            var html = response.text;
            log("Got search HTML, length: " + html.length);
            
            var novels = [];
            var seen = {};
            var startPos = 0;
            
            while (startPos < html.length && novels.length < 20) {
                var linkStart = html.indexOf('href="/novel/', startPos);
                if (linkStart === -1) break;
                
                var linkEnd = html.indexOf('"', linkStart + 6);
                if (linkEnd === -1) break;
                
                var novelPath = html.substring(linkStart + 6, linkEnd);
                var novelId = novelPath.replace('/novel/', '');
                
                if (seen[novelId] || novelId.indexOf('/') !== -1) {
                    startPos = linkEnd + 1;
                    continue;
                }
                seen[novelId] = true;
                
                var title = "";
                var titleStart = html.indexOf('title="', linkEnd);
                if (titleStart !== -1 && titleStart < linkEnd + 200) {
                    var titleEnd = html.indexOf('"', titleStart + 7);
                    if (titleEnd !== -1) {
                        title = this._cleanText(html.substring(titleStart + 7, titleEnd));
                    }
                }
                
                if (!title) {
                    title = novelId.split('-').join(' ');
                }
                
                novels.push({
                    novelId: novelId,
                    title: title,
                    author: "Unknown",
                    description: "",
                    coverUrl: ""
                });
                
                startPos = linkEnd + 1;
            }
            
            log("Search found " + novels.length + " novels");
            log("=== searchNovels END ===");
            return novels;
            
        } catch (e) {
            log("EXCEPTION in searchNovels: " + e.message);
            throw e;
        }
    },
    
    getChapterList: function(novelId) {
        try {
            log("=== getChapterList START ===");
            log("Novel ID: " + novelId);
            
            var url = this._buildUrl("/novel/" + novelId);
            log("Fetching: " + url);
            
            var response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response || !response.ok) {
                throw new Error("Chapter list fetch failed");
            }
            
            var html = response.text;
            log("Got novel page HTML, length: " + html.length);
            
            var chapters = [];
            var seen = {};
            var searchPattern = '/novel/' + novelId + '/';
            var startPos = 0;
            var index = 0;
            
            while (startPos < html.length && chapters.length < 500) {
                var chapterLinkStart = html.indexOf(searchPattern, startPos);
                if (chapterLinkStart === -1) break;
                
                var chapterLinkEnd = html.indexOf('"', chapterLinkStart);
                if (chapterLinkEnd === -1) break;
                
                var fullPath = html.substring(chapterLinkStart, chapterLinkEnd);
                var chapterIdPart = fullPath.replace('/novel/' + novelId + '/', '');
                
                if (seen[chapterIdPart] || !chapterIdPart || chapterIdPart === novelId) {
                    startPos = chapterLinkEnd + 1;
                    continue;
                }
                seen[chapterIdPart] = true;
                
                var chapterTitle = "";
                var titleStart = html.indexOf('title="', chapterLinkEnd);
                if (titleStart !== -1 && titleStart < chapterLinkEnd + 100) {
                    var titleEnd = html.indexOf('"', titleStart + 7);
                    if (titleEnd !== -1) {
                        chapterTitle = this._cleanText(html.substring(titleStart + 7, titleEnd));
                    }
                }
                
                if (!chapterTitle) {
                    chapterTitle = chapterIdPart.split('-').join(' ');
                }
                
                chapters.push({
                    chapterId: novelId + "/" + chapterIdPart,
                    title: chapterTitle,
                    index: index
                });
                
                index++;
                startPos = chapterLinkEnd + 1;
            }
            
            if (chapters.length === 0) {
                log("No chapters found, creating fallback");
                chapters.push({
                    chapterId: novelId + "/chapter-1",
                    title: "Chapter 1",
                    index: 0
                });
            }
            
            log("Found " + chapters.length + " chapters");
            log("=== getChapterList END ===");
            return chapters;
            
        } catch (e) {
            log("EXCEPTION in getChapterList: " + e.message);
            throw e;
        }
    },
    
    getChapterContent: function(chapterId) {
        try {
            log("=== getChapterContent START ===");
            log("Chapter ID: " + chapterId);
            
            var url = this._buildUrl("/novel/" + chapterId);
            log("Fetching: " + url);
            
            var response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response || !response.ok) {
                throw new Error("Chapter fetch failed");
            }
            
            var html = response.text;
            log("Got chapter HTML, length: " + html.length);
            
            var content = "";
            var articleStart = html.indexOf('<div id="article">');
            
            if (articleStart !== -1) {
                var articleEnd = html.indexOf('</div>', articleStart);
                if (articleEnd !== -1) {
                    content = html.substring(articleStart + 18, articleEnd);
                    log("Extracted from article div: " + content.length + " chars");
                }
            }
            
            if (!content || content.length < 100) {
                log("Fallback: extracting paragraphs");
                var paragraphs = [];
                var searchPos = 0;
                var maxParagraphs = 200;
                
                while (searchPos < html.length && paragraphs.length < maxParagraphs) {
                    var pStart = html.indexOf('<p>', searchPos);
                    if (pStart === -1) break;
                    
                    var pEnd = html.indexOf('</p>', pStart);
                    if (pEnd === -1) break;
                    
                    var pContent = html.substring(pStart + 3, pEnd);
                    var cleanP = this._cleanText(pContent);
                    
                    if (cleanP.length > 20) {
                        paragraphs.push('<p>' + cleanP + '</p>');
                    }
                    
                    searchPos = pEnd + 4;
                }
                
                if (paragraphs.length > 0) {
                    content = paragraphs.join('\n');
                    log("Extracted " + paragraphs.length + " paragraphs");
                }
            }
            
            if (!content || content.length < 50) {
                log("ERROR: Could not extract content");
                return "<div style='padding: 20px;'><p><strong>Could not extract chapter content.</strong></p><p>Chapter: " + chapterId + "</p></div>";
            }
            
            content = content
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            
            var result = '<div style="font-family: Georgia, serif; font-size: 18px; line-height: 1.8; padding: 20px; color: #333;">' + content + '</div>';
            
            log("Returning HTML content, length: " + result.length);
            log("=== getChapterContent END ===");
            
            return result;
            
        } catch (e) {
            log("EXCEPTION in getChapterContent: " + e.message);
            return "<div style='padding: 20px;'><p><strong>Error:</strong> " + e.message + "</p></div>";
        }
    }
};