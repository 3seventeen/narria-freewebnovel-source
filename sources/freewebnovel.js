var SourceMetadata = {
    id: "freewebnovel",
    name: "Free Web Novel",
    baseURL: "https://freewebnovel.com",
    iconURL: "https://freewebnovel.com/favicon.ico",
    version: "1.1.0",
    language: "en",
    contentRating: "mature",
    description: "Read free web novels and light novels online",
    author: "Community",
    capabilities: {
        popular: true,
        search: true,
        latest: true,
        filters: true
    }
};

var NovelSource = {
    baseUrl: "https://freewebnovel.com",
    
    getFilters: function() {
        return {
            sort: {
                type: "select",
                label: "Sort By",
                options: [
                    { value: "most-popular", label: "Most Popular" },
                    { value: "latest-novel", label: "Latest Novels" },
                    { value: "latest-release", label: "Latest Release" },
                    { value: "completed-novel", label: "Completed Novels" }
                ],
                default: "most-popular"
            },
            genre: {
                type: "select",
                label: "Genre",
                options: [
                    { value: "", label: "All Genres" },
                    { value: "Action", label: "Action" },
                    { value: "Adult", label: "Adult" },
                    { value: "Adventure", label: "Adventure" },
                    { value: "Comedy", label: "Comedy" },
                    { value: "Drama", label: "Drama" },
                    { value: "Eastern", label: "Eastern" },
                    { value: "Ecchi", label: "Ecchi" },
                    { value: "Fantasy", label: "Fantasy" },
                    { value: "Gender Bender", label: "Gender Bender" },
                    { value: "Harem", label: "Harem" },
                    { value: "Historical", label: "Historical" },
                    { value: "Horror", label: "Horror" },
                    { value: "Josei", label: "Josei" },
                    { value: "Game", label: "Game" },
                    { value: "Martial Arts", label: "Martial Arts" },
                    { value: "Mature", label: "Mature" },
                    { value: "Mecha", label: "Mecha" },
                    { value: "Mystery", label: "Mystery" },
                    { value: "Psychological", label: "Psychological" },
                    { value: "Reincarnation", label: "Reincarnation" },
                    { value: "Romance", label: "Romance" },
                    { value: "School Life", label: "School Life" },
                    { value: "Sci-fi", label: "Sci-fi" },
                    { value: "Seinen", label: "Seinen" },
                    { value: "Shoujo", label: "Shoujo" },
                    { value: "Shounen Ai", label: "Shounen Ai" },
                    { value: "Shounen", label: "Shounen" },
                    { value: "Slice of Life", label: "Slice of Life" },
                    { value: "Smut", label: "Smut" },
                    { value: "Sports", label: "Sports" },
                    { value: "Supernatural", label: "Supernatural" },
                    { value: "Tragedy", label: "Tragedy" },
                    { value: "Wuxia", label: "Wuxia" },
                    { value: "Xianxia", label: "Xianxia" },
                    { value: "Xuanhuan", label: "Xuanhuan" },
                    { value: "Yaoi", label: "Yaoi" }
                ],
                default: ""
            }
        };
    },
    
    extractBetween: function(text, start, end) {
        var startIndex = text.indexOf(start);
        if (startIndex === -1) return "";
        var textAfterStart = text.substring(startIndex + start.length);
        var endIndex = textAfterStart.indexOf(end);
        if (endIndex === -1) return textAfterStart;
        return textAfterStart.substring(0, endIndex);
    },
    
    extractAll: function(text, pattern) {
        var results = [];
        var match;
        while ((match = pattern.exec(text)) !== null) {
            results.push(match);
        }
        return results;
    },
    
    getPopularNovels: function(page, filters) {
        page = page || 1;
        filters = filters || {};
        
        log("Fetching popular novels, page: " + page + ", filters: " + JSON.stringify(filters));
        
        var url;
        
        if (filters.genre && filters.genre !== "") {
            var genreEncoded = filters.genre.replace(/ /g, "+");
            url = NovelSource.baseUrl + "/genre/" + genreEncoded + (page > 1 ? "/" + page : "");
            log("Using genre filter: " + filters.genre);
        } else if (filters.sort && filters.sort !== "") {
            url = NovelSource.baseUrl + "/sort/" + filters.sort + (page > 1 ? "/" + page : "");
            log("Using sort filter: " + filters.sort);
        } else {
            url = NovelSource.baseUrl + "/most-popular" + (page > 1 ? "/" + page : "");
        }
        
        log("URL: " + url);
        
        try {
            log("About to call fetch...");
            var response = fetch(url);
            log("✅ Fetch returned, response type: " + typeof response);
            
            if (!response) {
                log("❌ No response object");
                return [];
            }
            
            log("Response exists, checking properties...");
            log("response.ok = " + response.ok);
            log("response.status = " + response.status);
            log("response.error = " + response.error);
            
            if (response.error) {
                log("❌ Response has error: " + response.error);
                return [];
            }
            
            if (!response.ok) {
                log("❌ HTTP error: " + response.status);
                return [];
            }
            
            log("About to access response.text...");
            log("typeof response.text = " + typeof response.text);
            
            var html = response.text;
            
            log("✅ Got html variable, type: " + typeof html);
            log("html length: " + (html ? html.length : "null/undefined"));
            
            if (!html) {
                log("❌ html is null or undefined");
                return [];
            }
            
            if (html.length === 0) {
                log("❌ html length is 0");
                return [];
            }
            
            log("✅ Starting to parse " + html.length + " characters...");
            
            var novels = [];
            
            var listStart = html.indexOf('<div class="ul-list1 ul-list1-2 ss-custom">');
            if (listStart === -1) {
                log("❌ Could not find novel list container");
                return [];
            }
            
            log("Found novel list container at position " + listStart);
            
            var listEnd = html.indexOf('<div class="col-slide">', listStart);
            if (listEnd === -1) {
                listEnd = html.length;
            }
            
            var listSection = html.substring(listStart, listEnd);
            log("List section length: " + listSection.length);
            
            var currentPos = 0;
            
            while (currentPos < listSection.length) {
                var liRowStart = listSection.indexOf('<div class="li-row">', currentPos);
                if (liRowStart === -1) {
                    break;
                }
                
                var nextLiRowStart = listSection.indexOf('<div class="li-row">', liRowStart + 1);
                var liRowEnd = nextLiRowStart > -1 ? nextLiRowStart : listSection.length;
                
                var novelBlock = listSection.substring(liRowStart, liRowEnd);
                
                var coverUrl = "";
                var imgMatch = novelBlock.match(/<img\s+src="([^"]+)"/);
                if (imgMatch) {
                    coverUrl = imgMatch[1];
                    if (coverUrl.indexOf("http") !== 0) {
                        coverUrl = NovelSource.baseUrl + coverUrl;
                    }
                }
                
                var novelLinkMatch = novelBlock.match(/<a\s+href="\/novel\/([^"]+)"\s+title="([^"]+)">/);
                if (!novelLinkMatch) {
                    novelLinkMatch = novelBlock.match(/<a\s+href="\/novel\/([^"]+)">/);
                }
                
                if (novelLinkMatch) {
                    var novelId = novelLinkMatch[1];
                    var title = novelLinkMatch.length > 2 ? novelLinkMatch[2] : "";
                    
                    if (!title) {
                        var titleMatch = novelBlock.match(/<h3\s+class="tit"><a[^>]*>([^<]+)<\/a><\/h3>/);
                        if (titleMatch) {
                            title = titleMatch[1].trim();
                        }
                    }
                    
                    var rating = "";
                    var ratingMatch = novelBlock.match(/<span>([0-9.]+)\s*<\/span>/);
                    if (ratingMatch) {
                        rating = ratingMatch[1];
                    }
                    
                    var genres = [];
                    var genrePattern = /<a\s+href="\/genre\/[^"]+"\s+class="novel"\s+title="[^"]+">([^<]+)<\/a>/g;
                    var genreMatch;
                    while ((genreMatch = genrePattern.exec(novelBlock)) !== null) {
                        genres.push(genreMatch[1].trim());
                    }
                    
                    var status = "";
                    var statusMatch = novelBlock.match(/<span\s+class="s2">([^<]+)<\/span>/);
                    if (statusMatch) {
                        status = statusMatch[1].trim();
                    }
                    
                    var description = "";
                    if (rating) {
                        description += "Rating: " + rating + "/5";
                    }
                    if (status) {
                        description += (description ? " • " : "") + "Status: " + status;
                    }
                    if (genres.length > 0) {
                        description += (description ? " • " : "") + "Genres: " + genres.join(", ");
                    }
                    
                    if (title && novelId) {
                        novels.push({
                            novelId: novelId,
                            title: title,
                            coverUrl: coverUrl,
                            author: "",
                            description: description
                        });
                        
                        log("Added: " + title + " (" + novels.length + ")");
                    }
                }
                
                currentPos = liRowEnd;
                
                if (novels.length >= 50) {
                    log("Reached 50 novel limit");
                    break;
                }
            }
            
            log("✅ DONE! Found " + novels.length + " novels");
            return novels;
            
        } catch (e) {
            log("❌ EXCEPTION: " + e);
            log("Exception type: " + typeof e);
            try {
                log("Exception message: " + e.message);
            } catch (e2) {
                log("Could not get exception message");
            }
            return [];
        }
    },
    
    searchNovels: function(query, page) {
        log("Searching for: " + query + ", page: " + page);
        
        var url = NovelSource.baseUrl + "/search?searchkey=" + encodeURIComponent(query);
        log("Search URL: " + url);
        
        var response = fetch(url);
        
        if (!response || response.error) {
            log("Error searching novels: " + (response ? response.error : "No response"));
            return [];
        }
        
        if (!response.ok) {
            log("Error searching novels: HTTP " + response.status);
            return [];
        }
        
        var html = response.text;
        log("✅ Got search results HTML, length: " + html.length);
        
        var novels = [];
        
        var listStart = html.indexOf('<div class="ul-list1');
        if (listStart === -1) {
            log("❌ Could not find search results container");
            return [];
        }
        
        log("Found search results container at position " + listStart);
        
        var listEnd = html.indexOf('<div class="col-slide">', listStart);
        if (listEnd === -1) {
            listEnd = html.length;
        }
        
        log("Search results end position: " + listEnd);
        
        var listSection = html.substring(listStart, listEnd);
        log("Search results section length: " + listSection.length);
        
        var currentPos = 0;
        
        while (currentPos < listSection.length) {
            var liRowStart = listSection.indexOf('<div class="li-row">', currentPos);
            if (liRowStart === -1) {
                break;
            }
            
            var nextLiRowStart = listSection.indexOf('<div class="li-row">', liRowStart + 1);
            var liRowEnd = nextLiRowStart > -1 ? nextLiRowStart : listSection.length;
            
            var resultBlock = listSection.substring(liRowStart, liRowEnd);
            
            log("Processing result block, length: " + resultBlock.length);
            
            var novelLinkMatch = resultBlock.match(/<a\s+href="\/novel\/([^"]+)"/);
            if (!novelLinkMatch) {
                log("⚠️ No novel link found in result block");
                currentPos = liRowEnd;
                continue;
            }
            
            var novelId = novelLinkMatch[1];
            log("Found novel ID: " + novelId);
            
            var title = "";
            var titleMatch = resultBlock.match(/<h3[^>]*class="tit"[^>]*>.*?<a[^>]*title="([^"]+)"/);
            if (titleMatch) {
                title = titleMatch[1];
            } else {
                var titleTextMatch = resultBlock.match(/<h3[^>]*class="tit"[^>]*>.*?<a[^>]*>([^<]+)<\/a>/);
                if (titleTextMatch) {
                    title = titleTextMatch[1].trim();
                }
            }
            
            log("Extracted title: " + title);
            
            var coverUrl = "";
            var imgMatch = resultBlock.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
                coverUrl = imgMatch[1];
                if (coverUrl.indexOf("http") !== 0) {
                    coverUrl = NovelSource.baseUrl + coverUrl;
                }
            }
            
            var rating = "";
            var ratingMatch = resultBlock.match(/<div[^>]*class="core"[^>]*>[\s\S]*?<span>([0-9.]+)\s*<\/span>/);
            if (ratingMatch) {
                rating = ratingMatch[1];
            }
            
            var genres = [];
            var genrePattern = /<a[^>]+href="\/genre\/[^"]+"[^>]*title="[^"]*">([^<]+)<\/a>/g;
            var genreMatch;
            while ((genreMatch = genrePattern.exec(resultBlock)) !== null) {
                if (genres.length < 3) {
                    genres.push(genreMatch[1].trim());
                }
            }
            
            var description = "";
            if (rating) {
                description += "Rating: " + rating + "/5";
            }
            if (genres.length > 0) {
                description += (description ? " • " : "") + "Genres: " + genres.join(", ");
            }
            
            if (title && novelId) {
                novels.push({
                    novelId: novelId,
                    title: title,
                    coverUrl: coverUrl,
                    author: "",
                    description: description
                });
                
                log("✅ Added search result: " + title + " (ID: " + novelId + ")");
            } else {
                log("⚠️ Skipping result - missing title or ID");
            }
            
            currentPos = liRowEnd;
            
            if (novels.length >= 50) {
                log("Reached 50 novel limit");
                break;
            }
        }
        
        log("✅ Search complete! Found " + novels.length + " novels for query: " + query);
        return novels;
    },
    
    getNovelDetails: function(novelId) {
        log("Getting details for novel: " + novelId);
        
        var url = NovelSource.baseUrl + "/novel/" + novelId;
        var response = fetch(url);
        
        if (!response || response.error || !response.ok) {
            log("Error fetching novel details");
            return null;
        }
        
        var html = response.text;
        
        var title = "";
        var titleMatch = html.match(/<h1\s+class="tit">([^<]+)<\/h1>/);
        if (titleMatch) {
            title = titleMatch[1].trim();
        }
        
        var coverUrl = "";
        var imgMatch = html.match(/<img\s+src="([^"]+)"\s+alt="[^"]+"\s+title="[^"]+"/);
        if (imgMatch) {
            coverUrl = imgMatch[1].indexOf("http") === 0 ? imgMatch[1] : NovelSource.baseUrl + imgMatch[1];
        }
        
        var author = "";
        var authorMatch = html.match(/<a\s+href="\/author\/[^"]+"\s+class="a1"\s+title="([^"]+)">/);
        if (authorMatch) {
            author = authorMatch[1];
        }
        
        var genres = [];
        var genrePattern = /<a\s+href="\/genre\/[^"]+"\s+class="a1"\s+title="[^"]+">([^<]+)<\/a>/g;
        var match;
        while ((match = genrePattern.exec(html)) !== null) {
            if (genres.length < 5) { // Limit to first 5 genres
                genres.push(match[1].trim());
            }
        }
        
        var status = "Unknown";
        var statusMatch = html.match(/<span\s+class="s1\s+s2"><a[^>]*>([^<]+)<\/a><\/span>/);
        if (statusMatch) {
            status = statusMatch[1].trim();
        }
        
        var rating = "0.0";
        var ratingMatch = html.match(/<p\s+class="vote">([0-9.]+)\s+\/\s+5/);
        if (ratingMatch) {
            rating = ratingMatch[1];
        }
        
        var description = "";
        var descStart = html.indexOf('<div class="inner">');
        if (descStart > -1) {
            var descEnd = html.indexOf('</div>', descStart + 100);
            if (descEnd > -1) {
                var descHTML = html.substring(descStart, descEnd);
                var pPattern = /<p>([^<]+)<\/p>/g;
                var paragraphs = [];
                while ((match = pPattern.exec(descHTML)) !== null) {
                    var text = match[1].trim();
                    text = text.replace(/\s+/g, " ");
                    if (text.length > 0) {
                        paragraphs.push(text);
                    }
                }
                description = paragraphs.join(" ");
            }
        }
        
        log("Extracted details: title=" + title + ", author=" + author + ", genres=" + genres.length + ", rating=" + rating + ", status=" + status);
        
        return {
            novelId: novelId,
            title: title,
            coverUrl: coverUrl,
            author: author,
            genres: genres,
            status: status,
            rating: rating,
            description: description
        };
    },
    
    getChapterList: function(novelId) {
        log("Getting chapters for novel: " + novelId);
        
        var url = NovelSource.baseUrl + "/novel/" + novelId;
        var response = fetch(url);
        
        if (!response || response.error) {
            log("Error fetching chapter list: " + (response ? response.error : "No response"));
            return [];
        }
        
        if (!response.ok) {
            log("Error fetching chapter list: HTTP " + response.status);
            return [];
        }
        
        var html = response.text;
        var chapters = [];
        
        var latestChapters = [];
        var latestSection = html.indexOf('<div class="m-newest1">');
        if (latestSection > -1) {
            var latestSectionEnd = html.indexOf('</ul>', latestSection);
            if (latestSectionEnd > -1) {
                var latestHTML = html.substring(latestSection, latestSectionEnd);
                var chapterPattern = /<a\s+href="\/novel\/[^\/]+\/(chapter-\d+)"[^>]*>([^<]+)<\/a>/g;
                var match;
                
                while ((match = chapterPattern.exec(latestHTML)) !== null) {
                    latestChapters.push({
                        slug: match[1],
                        title: match[2].trim()
                    });
                }
            }
        }
        
        var chapterListStart = html.indexOf('<div id="chapterlist">');
        if (chapterListStart === -1) {
            chapterListStart = latestSection > -1 ? html.indexOf('</ul>', latestSection) : 0;
        }
        
        var searchArea = chapterListStart > 0 ? html.substring(chapterListStart) : html;
        
        var chapterPattern = /<a\s+href="\/novel\/[^\/]+\/(chapter-\d+)"[^>]*>([^<]+)<\/a>/g;
        
        var match;
        var seen = {}; 
        
        for (var i = 0; i < latestChapters.length; i++) {
            seen[latestChapters[i].slug] = true;
        }
        
        while ((match = chapterPattern.exec(searchArea)) !== null) {
            var chapterSlug = match[1];
            
            if (seen[chapterSlug]) {
                continue;
            }
            seen[chapterSlug] = true;
            
            var title = match[2].trim();
            title = title.replace(/^Chapter\s+\d+\s*[-–:]\s*/i, "");
            
            chapters.push({
                chapterId: novelId + "/" + chapterSlug,
                title: title,
                index: chapters.length
            });
        }
        
        for (var j = 0; j < latestChapters.length; j++) {
            var latest = latestChapters[j];
            var title = latest.title.replace(/^Chapter\s+\d+\s*[-–:]\s*/i, "");
            
            chapters.push({
                chapterId: novelId + "/" + latest.slug,
                title: title,
                index: chapters.length
            });
        }
        
        log("Found " + chapters.length + " unique chapters for " + novelId + " (" + latestChapters.length + " latest appended)");
        return chapters;
    },
    
    getChapterContent: function(chapterId) {
        log("Getting content for chapter: " + chapterId);
        
        var novelId = "";
        var chapterNum = chapterId;
        
        if (chapterId.indexOf("/") > -1) {
            var parts = chapterId.split("/");
            novelId = parts[0];
            chapterNum = parts[1];
        } else {
            log("Error: chapterId must include novelId in format 'novelId/chapter-X'");
            return "<p>Error: Unable to fetch chapter content. Invalid chapter ID format.</p>";
        }
        
        var url = NovelSource.baseUrl + "/novel/" + novelId + "/" + chapterNum;
        log("Fetching from: " + url);
        
        var response = fetch(url);
        
        if (!response || response.error) {
            log("Error fetching chapter content: " + (response ? response.error : "No response"));
            return "<p>Error loading chapter content: " + (response ? response.error : "Network error") + "</p>";
        }
        
        if (!response.ok) {
            log("Error fetching chapter content: HTTP " + response.status);
            return "<p>Error loading chapter content. Status: " + response.status + "</p>";
        }
        
        var html = response.text;
        
        var content = "";
        
        var articleStart = html.indexOf('<div id="article">');
        
        if (articleStart > -1) {
            log("Found article div at position " + articleStart);
            
            
            var contentEnd = html.indexOf('<div class="chapter-end">', articleStart);
            if (contentEnd === -1) {
                contentEnd = html.indexOf('<!--bg-->', articleStart);
            }
            if (contentEnd === -1) {
                contentEnd = html.indexOf('<ul class="ul-list7">', articleStart + 1000);
            }
            if (contentEnd === -1) {
                contentEnd = html.length;
            }
            
            var articleContent = html.substring(articleStart, contentEnd);
            
            var paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
            var paragraphs = [];
            var match;
            
            while ((match = paragraphPattern.exec(articleContent)) !== null) {
                var pContent = match[1].trim();
                
                if (pContent.indexOf("𝑓𝘳𝑒𝑒𝓌𝘦𝘣") > -1 || 
                    pContent.indexOf("freewebnovel") > -1 ||
                    pContent.indexOf("<script") > -1 ||
                    pContent.indexOf("<div") > -1 ||
                    pContent.length < 10) {
                    continue;
                }
                
                pContent = pContent.replace(/<[^>]+>/g, ""); // Remove any inner tags
                pContent = pContent.replace(/&nbsp;/g, " ");
                pContent = pContent.replace(/\s{2,}/g, " ");
                pContent = pContent.trim();
                
                if (pContent.length > 10) {
                    paragraphs.push("<p>" + pContent + "</p>");
                }
            }
            
            if (paragraphs.length > 0) {
                content = paragraphs.join("\n");
                log("Successfully extracted " + paragraphs.length + " paragraphs from article div");
            }
        }
        
        if (!content || content.length < 100) {
            log("Trying fallback method: txt div");
            
            var txtStart = html.indexOf('<div class="txt">');
            if (txtStart === -1) {
                txtStart = html.indexOf('<div class="txt ');
            }
            
            if (txtStart > -1) {
                log("Found txt div at position " + txtStart);
                
                var innerArticleStart = html.indexOf('<div id="article">', txtStart);
                if (innerArticleStart > -1) {
                    var innerArticleEnd = html.indexOf('</div>', innerArticleStart + 100);
                    if (innerArticleEnd > -1) {
                        var innerContent = html.substring(innerArticleStart, innerArticleEnd);
                        
                        var paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
                        var paragraphs = [];
                        var match;
                        
                        while ((match = paragraphPattern.exec(innerContent)) !== null) {
                            var pContent = match[1].trim();
                            
                            if (pContent.indexOf("𝑓𝘳𝑒𝑒𝓌𝘦𝘣") > -1 || 
                                pContent.indexOf("freewebnovel") > -1 ||
                                pContent.length < 10) {
                                continue;
                            }
                            
                            pContent = pContent.replace(/<[^>]+>/g, "");
                            pContent = pContent.replace(/&nbsp;/g, " ");
                            pContent = pContent.replace(/\s{2,}/g, " ");
                            
                            if (pContent.length > 10) {
                                paragraphs.push("<p>" + pContent + "</p>");
                            }
                        }
                        
                        if (paragraphs.length > 0) {
                            content = paragraphs.join("\n");
                            log("Successfully extracted " + paragraphs.length + " paragraphs from txt div");
                        }
                    }
                }
            }
        }
        
        if (!content || content.length < 100) {
            log("Trying last resort method with markers");
            
            var startMarker = "Previous Chapter";
            var startIndex = html.indexOf(startMarker);
            
            if (startIndex === -1) {
                startMarker = '<div class="txt';
                startIndex = html.indexOf(startMarker);
            }
            
            if (startIndex === -1) {
                log("Could not find any start marker");
                log("HTML length: " + html.length);
                log("First 500 chars: " + html.substring(0, 500));
                return "<p>Error: Could not locate chapter content. The website structure may have changed.</p>";
            }
            
            var endMarkers = [
                "Prev Chapter",
                '<div class="m-b-15 text-center">',
                '<div class="comment">',
                "Use arrow keys",
                "Add to Library",
                '<div class="row m-b-15">'
            ];
            
            var endIndex = -1;
            for (var i = 0; i < endMarkers.length; i++) {
                var idx = html.indexOf(endMarkers[i], startIndex + 100);
                if (idx > -1 && (endIndex === -1 || idx < endIndex)) {
                    endIndex = idx;
                }
            }
            
            if (endIndex === -1) {
                endIndex = html.length;
            }
            
            var contentSection = html.substring(startIndex, endIndex);
            
            contentSection = contentSection.replace(/Previous\s+Chapter/g, "");
            contentSection = contentSection.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
            contentSection = contentSection.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
            contentSection = contentSection.replace(/<a[^>]+class="[^"]*btn[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "");
            
            var paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
            var paragraphs = [];
            var match;
            
            while ((match = paragraphPattern.exec(contentSection)) !== null) {
                var pContent = match[1].trim();
                pContent = pContent.replace(/<[^>]+>/g, "");
                pContent = pContent.replace(/&nbsp;/g, " ");
                pContent = pContent.replace(/\s{2,}/g, " ");
                
                if (pContent.length > 10) {
                    paragraphs.push("<p>" + pContent + "</p>");
                }
            }
            
            if (paragraphs.length > 0) {
                content = paragraphs.join("\n");
            } else {
                var textContent = contentSection.replace(/<[^>]+>/g, " ");
                textContent = textContent.replace(/\s+/g, " ").trim();
                
                var lines = textContent.split(/\n\n+/);
                paragraphs = [];
                
                for (var j = 0; j < lines.length; j++) {
                    var line = lines[j].trim();
                    if (line.length > 20) {
                        paragraphs.push("<p>" + line + "</p>");
                    }
                }
                
                content = paragraphs.join("\n");
            }
        }
        
        if (!content || content.trim().length < 50) {
            log("Warning: Extracted content is too short");
            return "<p>Chapter content was found but appears to be too short. This may be a parsing error.</p>";
        }
        
        log("Successfully extracted " + content.length + " characters");
        return content;
    }
};

log("✅ FreeWebNovel plugin loaded successfully");
X
