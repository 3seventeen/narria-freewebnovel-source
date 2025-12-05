// FreeWebNovel.com Source Plugin for Narria
const NovelSource = {
    baseUrl: "https://freewebnovel.com",
    
    // Helper function to extract text between two strings
    extractBetween: function(text, start, end) {
        const startIndex = text.indexOf(start);
        if (startIndex === -1) return "";
        const textAfterStart = text.substring(startIndex + start.length);
        const endIndex = textAfterStart.indexOf(end);
        if (endIndex === -1) return textAfterStart;
        return textAfterStart.substring(0, endIndex);
    },
    
    // Helper function to extract all matches of a pattern
    extractAll: function(text, pattern) {
        const results = [];
        let match;
        while ((match = pattern.exec(text)) !== null) {
            results.push(match);
        }
        return results;
    },
    
    // Method 1: Get popular novels (with pagination)
    getPopularNovels: function(page) {
        log("Fetching popular novels, page: " + page);
        
        const url = this.baseUrl + "/sort/most-popular" + (page > 1 ? "/" + page : "");
        const response = fetch(url);
        
        if (!response.ok) {
            log("Error fetching popular novels: " + response.status);
            return [];
        }
        
        const html = response.text;
        const novels = [];
        
        // Pattern to match novel entries - looking for links to /novel/{slug}
        // Each novel card has: <a href="/novel/{slug}" ...>
        const novelPattern = /<a\s+href="\/novel\/([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/g;
        
        let match;
        while ((match = novelPattern.exec(html)) !== null) {
            const novelId = match[1]; // The novel slug (e.g., "martial-god-asura-novel")
            const coverUrl = match[2].startsWith("http") ? match[2] : this.baseUrl + match[2];
            const title = match[3];
            
            novels.push({
                novelId: novelId,
                title: title,
                coverUrl: coverUrl,
                author: "",
                description: ""
            });
        }
        
        log("Found " + novels.length + " novels on page " + page);
        return novels;
    },
    
    // Method 2: Search for novels
    searchNovels: function(query, page) {
        log("Searching for: " + query + ", page: " + page);
        
        // FreeWebNovel uses /search?q= for search
        const url = this.baseUrl + "/search?q=" + encodeURIComponent(query);
        const response = fetch(url);
        
        if (!response.ok) {
            log("Error searching novels: " + response.status);
            return [];
        }
        
        const html = response.text;
        const novels = [];
        
        // Use the same pattern as getPopularNovels to extract search results
        const novelPattern = /<a\s+href="\/novel\/([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/g;
        
        let match;
        while ((match = novelPattern.exec(html)) !== null) {
            const novelId = match[1];
            const coverUrl = match[2].startsWith("http") ? match[2] : this.baseUrl + match[2];
            const title = match[3];
            
            novels.push({
                novelId: novelId,
                title: title,
                coverUrl: coverUrl,
                author: "",
                description: ""
            });
        }
        
        log("Found " + novels.length + " novels for query: " + query);
        return novels;
    },
    
    // Method 3: Get chapter list for a novel
    getChapterList: function(novelId) {
        log("Getting chapters for novel: " + novelId);
        
        const url = this.baseUrl + "/novel/" + novelId;
        const response = fetch(url);
        
        if (!response.ok) {
            log("Error fetching chapter list: " + response.status);
            return [];
        }
        
        const html = response.text;
        const chapters = [];
        
        // Pattern to match chapter links: <a href="/novel/{novelId}/chapter-{number}">Chapter Title</a>
        const chapterPattern = /<a\s+href="\/novel\/[^\/]+\/(chapter-\d+)"[^>]*>([^<]+)<\/a>/g;
        
        let match;
        let index = 0;
        
        while ((match = chapterPattern.exec(html)) !== null) {
            const chapterSlug = match[1]; // e.g., "chapter-1"
            let title = match[2].trim();
            
            // Remove "Chapter X" prefix if it's duplicated
            title = title.replace(/^Chapter\s+\d+\s*[-–:]\s*/i, "");
            
            // IMPORTANT: Include novelId in chapterId so getChapterContent can construct the URL
            // Format: "novelId/chapter-X"
            chapters.push({
                chapterId: novelId + "/" + chapterSlug,
                title: title,
                index: index
            });
            
            index++;
        }
        
        log("Found " + chapters.length + " chapters for " + novelId);
        return chapters;
    },
    
    // Method 4: Get chapter content
    getChapterContent: function(chapterId) {
        log("Getting content for chapter: " + chapterId);
        
        // Extract novelId and chapter number from chapterId
        // Format should be: "novelId/chapter-X"
        let novelId = "";
        let chapterNum = chapterId;
        
        if (chapterId.indexOf("/") > -1) {
            const parts = chapterId.split("/");
            novelId = parts[0];
            chapterNum = parts[1];
        } else {
            log("Error: chapterId must include novelId in format 'novelId/chapter-X'");
            return "<p>Error: Unable to fetch chapter content. Invalid chapter ID format.</p>";
        }
        
        const url = this.baseUrl + "/novel/" + novelId + "/" + chapterNum;
        log("Fetching from: " + url);
        const response = fetch(url);
        
        if (!response.ok) {
            log("Error fetching chapter content: " + response.status);
            return "<p>Error loading chapter content. Status: " + response.status + "</p>";
        }
        
        const html = response.text;
        
        // Method 1: Extract content between "Previous Chapter" and the next major section
        const startMarker = "Previous Chapter";
        const startIndex = html.indexOf(startMarker);
        
        if (startIndex === -1) {
            log("Could not find start marker");
            return "<p>Error: Could not locate chapter content.</p>";
        }
        
        // Find the end marker - usually "Prev Chapter" button or comments section
        const endMarkers = [
            "Prev Chapter",
            '<div class="m-b-15 text-center">',
            '<div class="comment">',
            "Use arrow keys",
            "Add to Library"
        ];
        
        let endIndex = -1;
        for (let i = 0; i < endMarkers.length; i++) {
            const idx = html.indexOf(endMarkers[i], startIndex + 100); // Start looking after start marker
            if (idx > -1 && (endIndex === -1 || idx < endIndex)) {
                endIndex = idx;
            }
        }
        
        if (endIndex === -1) {
            endIndex = html.length;
        }
        
        let contentSection = html.substring(startIndex, endIndex);
        
        // Clean up the content section
        // Remove the "Previous Chapter" text
        contentSection = contentSection.replace(/Previous\s+Chapter/g, "");
        
        // Remove script and style tags
        contentSection = contentSection.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        contentSection = contentSection.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        
        // Remove navigation links and buttons
        contentSection = contentSection.replace(/<a[^>]+class="[^"]*btn[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "");
        
        // Extract paragraphs and convert double newlines to paragraph tags
        let content = "";
        
        // Try to extract existing paragraph tags first
        const paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
        let paragraphs = [];
        let match;
        
        while ((match = paragraphPattern.exec(contentSection)) !== null) {
            const pContent = match[1].trim();
            if (pContent.length > 0) {
                paragraphs.push("<p>" + pContent + "</p>");
            }
        }
        
        if (paragraphs.length > 0) {
            content = paragraphs.join("\n");
        } else {
            // Fallback: Split by double newlines and wrap in p tags
            // Remove all HTML tags first
            let textContent = contentSection.replace(/<[^>]+>/g, " ");
            textContent = textContent.replace(/\s+/g, " ").trim();
            
            // Split into paragraphs (assuming empty lines separate them)
            const lines = textContent.split(/\n\n+/);
            paragraphs = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length > 20) { // Only include substantial lines
                    paragraphs.push("<p>" + line + "</p>");
                }
            }
            
            content = paragraphs.join("\n");
        }
        
        // Final cleanup
        content = content.replace(/&nbsp;/g, " ");
        content = content.replace(/\s{2,}/g, " ");
        
        if (!content || content.trim().length < 50) {
            log("Warning: Extracted content is too short for " + chapterId);
            log("Content length: " + content.length);
            return "<p>Chapter content was found but appears to be too short. This may be a parsing error.</p><p>URL: " + url + "</p>";
        }
        
        log("Successfully extracted " + content.length + " characters for " + chapterId);
        return content;
    }
};

// Export for use by the app
NovelSource;
