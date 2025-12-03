const NovelSource = {
    baseUrl: "https://freewebnovel.com",
    
    /**
     * Extract text between two strings
     */
    _extractBetween: function(html, start, end) {
        if (!html) return "";
        const startIdx = html.indexOf(start);
        if (startIdx === -1) return "";
        const contentStart = startIdx + start.length;
        const endIdx = html.indexOf(end, contentStart);
        if (endIdx === -1) return "";
        return html.substring(contentStart, endIdx).trim();
    },
    
    /**
     * Extract attribute value from HTML tag
     */
    _extractAttr: function(html, attr) {
        if (!html) return "";
        const attrPattern = attr + '="([^"]+)"';
        const regex = new RegExp(attrPattern, 'i');
        const match = html.match(regex);
        return match ? match[1] : "";
    },
    
    /**
     * Clean HTML text
     */
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
    
    /**
     * Build full URL
     */
    _buildUrl: function(path) {
        if (!path) return this.baseUrl;
        if (path.startsWith('http')) return path;
        if (path.startsWith('/')) return this.baseUrl + path;
        return this.baseUrl + '/' + path;
    },
    
    /**
     * Get popular novels from latest-release page
     */
    getPopularNovels: function(page) {
        try {
            log("Getting popular novels, page: " + page);
            
            const url = this._buildUrl("/sort/latest-release");
            const response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            
            const html = response.text;
            const novels = [];
            const seen = {};
            
            // Find all novel links: <a href="/novel/novel-slug">
            const novelLinkPattern = '<a\\s+href="(/novel/[^"]+)"[^>]*title="([^"]*)"';
            const regex = new RegExp(novelLinkPattern, 'gi');
            let match;
            
            while ((match = regex.exec(html)) !== null && novels.length < 20) {
                const novelPath = match[1];
                const title = this._cleanText(match[2]);
                
                // Extract novel ID from path
                const novelId = novelPath.replace('/novel/', '');
                
                if (seen[novelId] || !novelId) continue;
                seen[novelId] = true;
                
                // Try to find cover image nearby this link
                const linkStart = match.index;
                const contextStart = Math.max(0, linkStart - 500);
                const contextEnd = Math.min(html.length, linkStart + 500);
                const context = html.substring(contextStart, contextEnd);
                
                const imgMatch = context.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"/);
                let coverUrl = "";
                if (imgMatch && imgMatch[1]) {
                    coverUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : this._buildUrl(imgMatch[1]);
                }
                
                novels.push({
                    novelId: novelId,
                    title: title || novelId.replace(/-/g, ' '),
                    author: "Unknown",
                    description: "",
                    coverUrl: coverUrl
                });
                
                log("Added novel: " + title + " (ID: " + novelId + ")");
            }
            
            if (novels.length === 0) {
                throw new Error("No novels found - website structure may have changed");
            }
            
            log("Found " + novels.length + " novels");
            return novels;
            
        } catch (e) {
            log("Error in getPopularNovels: " + e.message);
            throw new Error("Failed to fetch popular novels: " + e.message);
        }
    },
    
    /**
     * Search novels by query
     */
    searchNovels: function(query, page) {
        try {
            log("Searching for: " + query);
            
            const searchUrl = this._buildUrl("/search/" + encodeURIComponent(query));
            const response = fetch(searchUrl, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            
            const html = response.text;
            const novels = [];
            const seen = {};
            
            const novelLinkPattern = '<a\\s+href="(/novel/[^"]+)"[^>]*title="([^"]*)"';
            const regex = new RegExp(novelLinkPattern, 'gi');
            let match;
            
            while ((match = regex.exec(html)) !== null && novels.length < 20) {
                const novelPath = match[1];
                const title = this._cleanText(match[2]);
                const novelId = novelPath.replace('/novel/', '');
                
                if (seen[novelId] || !novelId) continue;
                seen[novelId] = true;
                
                const linkStart = match.index;
                const contextStart = Math.max(0, linkStart - 500);
                const contextEnd = Math.min(html.length, linkStart + 500);
                const context = html.substring(contextStart, contextEnd);
                
                const imgMatch = context.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"/);
                let coverUrl = "";
                if (imgMatch && imgMatch[1]) {
                    coverUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : this._buildUrl(imgMatch[1]);
                }
                
                novels.push({
                    novelId: novelId,
                    title: title || novelId.replace(/-/g, ' '),
                    author: "Unknown",
                    description: "",
                    coverUrl: coverUrl
                });
            }
            
            log("Found " + novels.length + " search results");
            return novels;
            
        } catch (e) {
            log("Error in searchNovels: " + e.message);
            throw new Error("Search failed: " + e.message);
        }
    },
    
    /**
     * Get chapter list for a novel
     */
    getChapterList: function(novelId) {
        try {
            log("Getting chapters for: " + novelId);
            
            const url = this._buildUrl("/novel/" + novelId);
            const response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            
            const html = response.text;
            const chapters = [];
            const seen = {};
            
            // Pattern: <a href="/novel/novel-id/chapter-X" title="Chapter X: Title">
            const chapterPattern = '<a\\s+href="(/novel/' + novelId + '/[^"]+)"[^>]*title="([^"]*)"[^>]*>';
            const regex = new RegExp(chapterPattern, 'gi');
            let match;
            let index = 0;
            
            while ((match = regex.exec(html)) !== null) {
                const chapterPath = match[1];
                let chapterTitle = this._cleanText(match[2]);
                
                // Extract chapter ID from path
                const chapterIdMatch = chapterPath.match(/\/novel\/[^\/]+\/(.+)/);
                if (!chapterIdMatch) continue;
                
                const chapterId = chapterIdMatch[1];
                
                if (seen[chapterId]) continue;
                seen[chapterId] = true;
                
                if (!chapterTitle) {
                    chapterTitle = chapterId.replace(/-/g, ' ');
                }
                
                chapters.push({
                    chapterId: novelId + "/" + chapterId,
                    title: chapterTitle,
                    index: index++
                });
            }
            
            if (chapters.length === 0) {
                log("No chapters found, creating fallback chapter");
                chapters.push({
                    chapterId: novelId + "/chapter-1",
                    title: "Chapter 1",
                    index: 0
                });
            }
            
            log("Found " + chapters.length + " chapters");
            return chapters;
            
        } catch (e) {
            log("Error in getChapterList: " + e.message);
            throw new Error("Failed to get chapters: " + e.message);
        }
    },
    
    /**
     * Get chapter content as HTML
     */
    getChapterContent: function(chapterId) {
        try {
            log("Getting content for chapter: " + chapterId);
            
            const url = this._buildUrl("/novel/" + chapterId);
            const response = fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Narria/1.0 (iOS)"
                }
            });
            
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            
            const html = response.text;
            
            // Look for the chapter content inside <div id="article">
            let content = this._extractBetween(html, '<div id="article">', '</div>');
            
            if (!content || content.length < 100) {
                // Fallback: look for paragraphs in .txt div
                const txtSection = this._extractBetween(html, '<div class="txt', '</div>');
                if (txtSection) {
                    const paragraphs = [];
                    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
                    let pMatch;
                    while ((pMatch = pRegex.exec(txtSection)) !== null) {
                        const pText = pMatch[1].trim();
                        if (pText.length > 20) {
                            paragraphs.push('<p>' + pText + '</p>');
                        }
                    }
                    if (paragraphs.length > 0) {
                        content = paragraphs.join('\n');
                    }
                }
            }
            
            if (!content || content.length < 50) {
                log("WARNING: Content extraction failed or very short");
                return {
                    html: "<div style='padding: 20px;'><p><strong>Content could not be extracted.</strong></p>" +
                          "<p>The chapter page structure may have changed.</p>" +
                          "<p>Chapter ID: " + chapterId + "</p></div>"
                };
            }
            
            // Clean up the content
            content = content
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
                .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
            
            // Wrap in styled container
            const styledHtml = 
                '<div style="font-family: Georgia, serif; font-size: 18px; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">' +
                content +
                '</div>';
            
            log("Content extracted successfully (" + content.length + " characters)");
            
            return {
                html: styledHtml
            };
            
        } catch (e) {
            log("Error in getChapterContent: " + e.message);
            return {
                html: "<div style='padding: 20px;'><p><strong>Error loading chapter:</strong> " + e.message + "</p></div>"
            };
        }
    }
};