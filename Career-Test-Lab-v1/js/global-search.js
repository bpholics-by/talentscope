(function () {
    "use strict";

    var BOX_ID = "globalSearchSuggestions";

    function loadSearchData() {
        var data = [];
        try {
            // Daftar semua kemungkinan key LocalStorage untuk project di aplikasi Anda
            var projectKeys = [
                "talentscope_projects", 
                "projects", 
                "projectList", 
                "talentscope_project_list", 
                "assessment_projects"
            ];
            
            var projects = [];
            projectKeys.forEach(function(key) {
                var stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        var parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            projects = projects.concat(parsed);
                        }
                    } catch (err) {}
                }
            });

            projects.forEach(function (p) {
                var pName = p.projectName || p.namaProject || p.nama_project || p.name || p.title || p.project || "";
                var pId = String(p.id || p.projectId || p.project_id || "");
                
                if (pName || pId) {
                    data.push({
                        title: pName || ("Project ID: " + pId),
                        meta: "Project" + (pId ? " (ID: " + pId + ")" : ""),
                        search: (pName + " " + pId).toLowerCase()
                    });
                }

                if (Array.isArray(p.participants)) {
                    p.participants.forEach(function (part) {
                        var n = part.name || part.fullName || part.nama || "";
                        if (n) {
                            data.push({
                                title: n,
                                meta: "Peserta di " + (pName || "Project"),
                                search: (n + " " + pName).toLowerCase()
                            });
                        }
                    });
                }
            });

            // Daftar semua kemungkinan key LocalStorage untuk participants/database peserta
            var participantKeys = [
                "talentscope_participants_db", 
                "participants", 
                "talentscope_participants",
                "peserta_list"
            ];

            var participants = [];
            participantKeys.forEach(function(key) {
                var stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        var parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            participants = participants.concat(parsed);
                        }
                    } catch (err) {}
                }
            });

            participants.forEach(function (part) {
                var name = part.nama || part.name || part.fullName || "";
                var projName = part.namaProject || part.projectName || part.project || "";
                if (name || projName) {
                    data.push({
                        title: name || projName,
                        meta: "Peserta" + (projName ? " - " + projName : ""),
                        search: (name + " " + projName).toLowerCase()
                    });
                }
            });
        } catch (e) {
            console.error("GlobalSearch Error:", e);
        }
        return data;
    }

    function initGlobalSearch() {
        var input = document.getElementById("globalSearchInput") || document.querySelector('input[type="text"], input[placeholder*="Cari"]');
        if (!input || input.getAttribute("data-search-initialized") === "true") return;

        input.setAttribute("data-search-initialized", "true");

        if (input.parentNode) {
            input.parentNode.style.position = "relative";
        }

        var box = document.createElement("div");
        box.id = BOX_ID;
        box.style.cssText = "position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; margin-top: 5px; display: none; max-height: 300px; overflow-y: auto;";
        
        input.parentNode.appendChild(box);

        input.addEventListener("input", function () {
            var val = this.value.trim().toLowerCase();
            if (!val) { 
                box.style.display = "none"; 
                return; 
            }
            
            var allData = loadSearchData();
            var matches = allData.filter(function(i) { 
                return i.search.indexOf(val) !== -1; 
            }).slice(0, 8);

            if (matches.length > 0) {
                box.innerHTML = matches.map(function(m) {
                    return '<div class="search-suggestion-item" data-val="' + encodeURIComponent(m.title) + '" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9;">' +
                                '<strong style="color: #1e293b; font-size: 14px;">' + m.title + '</strong><br>' +
                                '<small style="color: #64748b; font-size: 12px;">' + m.meta + '</small>' +
                           '</div>';
                }).join("");
                box.style.display = "block";
            } else {
                box.innerHTML = '<div style="padding: 12px; color: #888; text-align: center; font-size: 13px;">Tidak ditemukan</div>';
                box.style.display = "block";
            }
        });

        box.addEventListener("click", function(e) {
            var item = e.target.closest(".search-suggestion-item");
            if (item) {
                var targetVal = item.getAttribute("data-val");
                window.location.href = "database.html?search=" + targetVal;
            }
        });

        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                var keyword = encodeURIComponent(this.value.trim());
                window.location.href = "database.html?search=" + keyword;
            }
        });

        document.addEventListener("click", function(e) {
            if (e.target !== input && !box.contains(e.target)) {
                box.style.display = "none";
            }
        });
    }

    document.addEventListener("DOMContentLoaded", initGlobalSearch);
    window.addEventListener("load", initGlobalSearch);
    
    var observer = new MutationObserver(function() {
        initGlobalSearch();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();