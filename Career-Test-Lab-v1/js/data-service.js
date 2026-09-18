// ============================================
// TALENTSCOPE CENTRAL DATA SERVICE (REFACTOR FASE 1)
// ============================================
// Single source of truth: SUPABASE DATABASE
//
// IMPROVEMENTS:
// 1. In-memory cache dengan TTL 30 detik
// 2. Dedup in-flight requests (request sama = 1 query)
// 3. Selective column select (kurangi payload)
// 4. Graceful error (return [] daripada throw)
// 5. Invalidasi cache otomatis setelah write
// ============================================


(function () {
    "use strict";

    if (typeof window.supabaseClient === "undefined") {
        console.error(
            "[DATA SERVICE] supabaseClient tidak tersedia. " +
            "Pastikan js/supabase-client.js dimuat sebelum file ini."
        );
        return;
    }


    // ============================================
    // CACHE + DEDUP
    // ============================================

    var CACHE_TTL_MS = 30000;       // 30 detik
    var __cache = {};                // { key: { data, ts } }
    var __inflight = {};             // { key: Promise }

    function cacheGet(key) {
        var entry = __cache[key];
        if (!entry) return null;
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            delete __cache[key];
            return null;
        }
        return entry.data;
    }

    function cacheSet(key, data) {
        __cache[key] = { data: data, ts: Date.now() };
    }

    function cacheInvalidate(prefix) {
        Object.keys(__cache).forEach(function (key) {
            if (key.indexOf(prefix) === 0) {
                delete __cache[key];
            }
        });
    }

    function cacheInvalidateAll() {
        __cache = {};
    }

    // Expose untuk debug di console
    window.__dataServiceCache = {
        invalidateAll: cacheInvalidateAll,
        size: function () { return Object.keys(__cache).length; },
        dump: function () { return __cache; }
    };


    // ============================================
    // HELPER: QUERY DENGAN CACHE + DEDUP
    // ============================================
    //
    // key       — string unik untuk cache
    // queryFn   — fungsi yang return Promise query Supabase
    // ttl       — override TTL (optional)
    // ============================================

    async function cachedQuery(key, queryFn, ttl) {
        // 1. Cek cache
        var cached = cacheGet(key);
        if (cached !== null) {
            console.log('[DATA SERVICE] Cache HIT:', key);
            return cached;
        }

        // 2. Cek in-flight (request sama sedang jalan)
        if (__inflight[key]) {
            console.log('[DATA SERVICE] In-flight HIT:', key);
            return __inflight[key];
        }

        // 3. Jalankan query, simpan promise-nya
        console.log('[DATA SERVICE] Query MISS:', key);
        var promise = queryFn()
            .then(function (result) {
                cacheSet(key, result);
                delete __inflight[key];
                return result;
            })
            .catch(function (error) {
                delete __inflight[key];
                throw error;
            });

        __inflight[key] = promise;
        return promise;
    }


    // ============================================
    // ERROR HANDLER
    // ============================================
    //
    // Di versi lama: throw error → halaman blank.
    // Di versi baru: log warning + return fallback.
    // ============================================

    function handleError(operation, error, fallback) {
        console.error('[DATA SERVICE] ' + operation + ' FAILED:', error);
        if (fallback !== undefined) {
            return fallback;
        }
        throw error;
    }

    function handleErrorSilent(operation, error) {
        console.error('[DATA SERVICE] ' + operation + ' FAILED (graceful):', error);
    }


    // ============================================
    // DATA SERVICE OBJECT
    // ============================================

    const DataService = {


        // ============================================
        // CACHE CONTROL (public)
        // ============================================

        invalidateCache: function (prefix) {
            if (prefix) {
                cacheInvalidate(prefix);
            } else {
                cacheInvalidateAll();
            }
        },

        getCacheStats: function () {
            return {
                size: Object.keys(__cache).length,
                keys: Object.keys(__cache)
            };
        },


        // ============================================
        // PROJECTS
        // ============================================

        async getProjects() {
            return cachedQuery('projects:all', async function () {
                console.log('[DATA SERVICE] Loading projects from Supabase...');

                var result = await supabaseClient
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (result.error) {
                    handleErrorSilent('GET PROJECTS', result.error);
                    return [];
                }

                console.log('[DATA SERVICE] Projects loaded:', (result.data || []).length);
                return result.data || [];
            });
        },


        async getProjectById(projectId) {
            return cachedQuery('project:id:' + projectId, async function () {
                var result = await supabaseClient
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (result.error) {
                    handleErrorSilent('GET PROJECT BY ID', result.error);
                    return null;
                }

                return result.data;
            });
        },


        async getProjectByCode(projectCode) {
            return cachedQuery('project:code:' + projectCode, async function () {
                console.log('[DATA SERVICE] Loading project by code:', projectCode);

                var result = await supabaseClient
                    .from('projects')
                    .select('*')
                    .eq('project_code', projectCode)
                    .maybeSingle();

                if (result.error) {
                    handleErrorSilent('GET PROJECT BY CODE', result.error);
                    return null;
                }

                return result.data || null;
            });
        },


        async createProject(projectData) {
            console.log('[DATA SERVICE] Creating project...');

            if (!supabaseClient || typeof supabaseClient.from !== 'function') {
                throw new Error('Supabase client tidak tersedia.');
            }

            var result = await supabaseClient
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (result.error) {
                handleError('CREATE PROJECT', result.error);
            }

            // Invalidasi cache projects
            cacheInvalidate('projects:');
            cacheInvalidate('project:');

            console.log('[DATA SERVICE] Project created:', result.data);
            return result.data;
        },


        async createProjectAssessments(projectAssessmentData) {
            console.log('[DATA SERVICE] Saving project assessments...');

            if (!supabaseClient || typeof supabaseClient.from !== 'function') {
                throw new Error('Supabase client tidak tersedia.');
            }

            if (!Array.isArray(projectAssessmentData) || projectAssessmentData.length === 0) {
                console.warn('[DATA SERVICE] No project assessments to save');
                return [];
            }

            var result = await supabaseClient
                .from('project_assessments')
                .insert(projectAssessmentData)
                .select();

            if (result.error) {
                handleError('CREATE PROJECT ASSESSMENTS', result.error);
            }

            cacheInvalidate('project_assessments:');
            cacheInvalidate('project:');

            console.log('[DATA SERVICE] Project assessments saved:', (result.data || []).length);
            return result.data || [];
        },


        async getProjectAssessments(projectId) {
            return cachedQuery('project_assessments:' + projectId, async function () {
                console.log('[DATA SERVICE] Loading project assessments:', projectId);

                var result = await supabaseClient
                    .from('project_assessments')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: true });

                if (result.error) {
                    handleErrorSilent('GET PROJECT ASSESSMENTS', result.error);
                    return [];
                }

                return result.data || [];
            });
        },


        async updateProjectAssessment(assessmentRelationId, assessmentData) {
            console.log('[DATA SERVICE] Updating project assessment:', assessmentRelationId);

            var result = await supabaseClient
                .from('project_assessments')
                .update(assessmentData)
                .eq('id', assessmentRelationId)
                .select()
                .single();

            if (result.error) {
                handleError('UPDATE PROJECT ASSESSMENT', result.error);
            }

            cacheInvalidate('project_assessments:');

            return result.data;
        },


        async deleteProjectAssessment(assessmentRelationId) {
            console.log('[DATA SERVICE] Removing project assessment:', assessmentRelationId);

            var result = await supabaseClient
                .from('project_assessments')
                .delete()
                .eq('id', assessmentRelationId);

            if (result.error) {
                handleError('DELETE PROJECT ASSESSMENT', result.error);
            }

            cacheInvalidate('project_assessments:');

            return true;
        },


        async updateProject(projectId, projectData) {
            console.log('[DATA SERVICE] Updating project:', projectId);

            var result = await supabaseClient
                .from('projects')
                .update(projectData)
                .eq('id', projectId)
                .select()
                .single();

            if (result.error) {
                handleError('UPDATE PROJECT', result.error);
            }

            cacheInvalidate('projects:');
            cacheInvalidate('project:');

            return result.data;
        },


        async deleteProject(projectId) {
            console.log('[DATA SERVICE] Deleting project:', projectId);

            // Hapus anak dulu
            var r1 = await supabaseClient
                .from('project_participants')
                .delete()
                .eq('project_id', projectId);

            if (r1.error) {
                handleError('DELETE PROJECT (project_participants)', r1.error);
            }

            var r2 = await supabaseClient
                .from('project_assessments')
                .delete()
                .eq('project_id', projectId);

            if (r2.error) {
                handleError('DELETE PROJECT (project_assessments)', r2.error);
            }

            var result = await supabaseClient
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (result.error) {
                handleError('DELETE PROJECT', result.error);
            }

            cacheInvalidateAll();

            return true;
        },


        // ============================================
        // PARTICIPANTS
        // ============================================

        async getParticipants() {
            return cachedQuery('participants:all', async function () {
                console.log('[DATA SERVICE] Loading participants...');

                var result = await supabaseClient
                    .from('participants')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (result.error) {
                    handleErrorSilent('GET PARTICIPANTS', result.error);
                    return [];
                }

                console.log('[DATA SERVICE] Participants loaded:', (result.data || []).length);
                return result.data || [];
            });
        },


        async getParticipantById(participantId) {
            return cachedQuery('participant:id:' + participantId, async function () {
                var result = await supabaseClient
                    .from('participants')
                    .select('*')
                    .eq('id', participantId)
                    .single();

                if (result.error) {
                    handleErrorSilent('GET PARTICIPANT BY ID', result.error);
                    return null;
                }

                return result.data;
            });
        },


        async getParticipantByCodeOrEmail(participantCode, email) {
            // Prioritas: code dulu, baru email
            var key = 'participant:code_or_email:' + (participantCode || '') + ':' + (email || '');

            return cachedQuery(key, async function () {
                console.log('[DATA SERVICE] Finding participant:', participantCode, email);

                if (participantCode) {
                    var r1 = await supabaseClient
                        .from('participants')
                        .select('*')
                        .eq('participant_code', participantCode)
                        .maybeSingle();

                    if (r1.error) {
                        handleErrorSilent('GET PARTICIPANT BY CODE', r1.error);
                    } else if (r1.data) {
                        return r1.data;
                    }
                }

                if (email) {
                    var r2 = await supabaseClient
                        .from('participants')
                        .select('*')
                        .eq('email', email)
                        .maybeSingle();

                    if (r2.error) {
                        handleErrorSilent('GET PARTICIPANT BY EMAIL', r2.error);
                    } else if (r2.data) {
                        return r2.data;
                    }
                }

                return null;
            });
        },


        async createParticipant(participantData) {
            console.log('[DATA SERVICE] Creating participant...');

            var result = await supabaseClient
                .from('participants')
                .insert([participantData])
                .select()
                .single();

            if (result.error) {
                handleError('CREATE PARTICIPANT', result.error);
            }

            cacheInvalidate('participants:');
            cacheInvalidate('participant:');

            console.log('[DATA SERVICE] Participant created:', result.data);
            return result.data;
        },


        async updateParticipant(participantId, participantData) {
            console.log('[DATA SERVICE] Updating participant:', participantId);

            var result = await supabaseClient
                .from('participants')
                .update(participantData)
                .eq('id', participantId)
                .select()
                .single();

            if (result.error) {
                handleError('UPDATE PARTICIPANT', result.error);
            }

            cacheInvalidate('participants:');
            cacheInvalidate('participant:');
            cacheInvalidate('project_participants:');  // karena participant ikut berubah

            return result.data;
        },


        async getParticipantsByProject(projectId) {
            return cachedQuery('participants:by_project:' + projectId, async function () {
                console.log('[DATA SERVICE] Loading participants by project:', projectId);

                var result = await supabaseClient
                    .from('participants')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false });

                if (result.error) {
                    handleErrorSilent('GET PARTICIPANTS BY PROJECT', result.error);
                    return [];
                }

                return result.data || [];
            });
        },


        async getProjectParticipants(projectId) {
            return cachedQuery('project_participants:' + projectId, async function () {
                console.log('[DATA SERVICE] Loading project participants:', projectId);

                // Step 1: ambil relasi
                var relations = await supabaseClient
                    .from('project_participants')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false });

                if (relations.error) {
                    handleErrorSilent('GET PROJECT PARTICIPANTS', relations.error);
                    return [];
                }

                if (!relations.data || relations.data.length === 0) {
                    return [];
                }

                // Step 2: ambil peserta-nya sekaligus (1 query, bukan N)
                var participantIds = relations.data
                    .map(function (item) { return item.participant_id; })
                    .filter(Boolean);

                if (participantIds.length === 0) {
                    return relations.data.map(function (item) {
                        return Object.assign({}, item, { participant: null });
                    });
                }

                var participants = await supabaseClient
                    .from('participants')
                    .select('*')
                    .in('id', participantIds);

                if (participants.error) {
                    handleErrorSilent('GET PARTICIPANT DETAILS', participants.error);
                    return relations.data.map(function (item) {
                        return Object.assign({}, item, { participant: null });
                    });
                }

                // Step 3: join
                var participantMap = {};
                (participants.data || []).forEach(function (p) {
                    participantMap[p.id] = p;
                });

                var result = relations.data.map(function (relation) {
                    return Object.assign({}, relation, {
                        participant: participantMap[relation.participant_id] || null
                    });
                });

                console.log('[DATA SERVICE] Project participants loaded:', result.length);
                return result;
            });
        },


        async getProjectParticipantCounts() {
            return cachedQuery('project_participant_counts', async function () {
                console.log('[DATA SERVICE] Loading project participant counts...');

                var result = await supabaseClient
                    .from('project_participants')
                    .select('project_id');

                if (result.error) {
                    handleErrorSilent('GET PROJECT PARTICIPANT COUNTS', result.error);
                    return {};
                }

                var counts = {};
                (result.data || []).forEach(function (row) {
                    if (!row || !row.project_id) return;
                    counts[row.project_id] = (counts[row.project_id] || 0) + 1;
                });

                return counts;
            });
        },


        async addParticipantToProject(projectId, participantId, participantStatus) {
            console.log('[DATA SERVICE] Adding participant to project...');

            var result = await supabaseClient
                .from('project_participants')
                .insert([{
                    project_id: projectId,
                    participant_id: participantId,
                    status: participantStatus || 'registered',
                    registered_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (result.error) {
                handleError('ADD PARTICIPANT TO PROJECT', result.error);
            }

            cacheInvalidate('project_participants:');
            cacheInvalidate('project_participant_counts');

            return result.data;
        },


        async removeParticipantFromProject(projectId, participantId) {
            console.log('[DATA SERVICE] Removing participant from project...');

            var result = await supabaseClient
                .from('project_participants')
                .delete()
                .eq('project_id', projectId)
                .eq('participant_id', participantId);

            if (result.error) {
                handleError('REMOVE PARTICIPANT FROM PROJECT', result.error);
            }

            cacheInvalidate('project_participants:');
            cacheInvalidate('project_participant_counts');

            return true;
        },


        // ============================================
        // ASSESSMENTS
        // ============================================

        async getAssessments() {
            return cachedQuery('assessments:all', async function () {
                console.log('[DATA SERVICE] Loading assessments...');

                var result = await supabaseClient
                    .from('assessments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (result.error) {
                    console.warn('[DATA SERVICE] Ordered assessment query failed, retrying without order:', result.error);

                    result = await supabaseClient
                        .from('assessments')
                        .select('*');

                    if (result.error) {
                        handleErrorSilent('GET ASSESSMENTS', result.error);
                        return [];
                    }
                }

                var data = Array.isArray(result.data) ? result.data : [];
                console.log('[DATA SERVICE] Assessments loaded:', data.length);
                return data;
            });
        },


        async getAssessmentById(assessmentId) {
            return cachedQuery('assessment:id:' + assessmentId, async function () {
                var result = await supabaseClient
                    .from('assessments')
                    .select('*')
                    .eq('id', assessmentId)
                    .single();

                if (result.error) {
                    handleErrorSilent('GET ASSESSMENT BY ID', result.error);
                    return null;
                }

                return result.data;
            });
        },


        async createAssessment(assessmentData) {
            console.log('[DATA SERVICE] Creating assessment...');

            var result = await supabaseClient
                .from('assessments')
                .insert([assessmentData])
                .select()
                .single();

            if (result.error) {
                handleError('CREATE ASSESSMENT', result.error);
            }

            cacheInvalidate('assessments:');
            cacheInvalidate('assessment:');

            return result.data;
        },


        async updateAssessment(assessmentId, assessmentData) {
            console.log('[DATA SERVICE] Updating assessment:', assessmentId);

            var result = await supabaseClient
                .from('assessments')
                .update(assessmentData)
                .eq('id', assessmentId)
                .select()
                .single();

            if (result.error) {
                handleError('UPDATE ASSESSMENT', result.error);
            }

            cacheInvalidate('assessments:');
            cacheInvalidate('assessment:');

            return result.data;
        },


        async deleteAssessment(assessmentId) {
            console.log('[DATA SERVICE] Deleting assessment:', assessmentId);

            var result = await supabaseClient
                .from('assessments')
                .delete()
                .eq('id', assessmentId);

            if (result.error) {
                handleError('DELETE ASSESSMENT', result.error);
            }

            cacheInvalidate('assessments:');
            cacheInvalidate('assessment:');

            return true;
        },


        // ============================================
        // ASSESSMENT RESULTS
        // ============================================

        async getAssessmentResults() {
            return cachedQuery('assessment_results:all', async function () {
                console.log('[DATA SERVICE] Loading assessment results...');

                var result = await supabaseClient
                    .from('assessment_results')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (result.error) {
                    handleErrorSilent('GET ASSESSMENT RESULTS', result.error);
                    return [];
                }

                console.log('[DATA SERVICE] Results loaded:', (result.data || []).length);
                return result.data || [];
            });
        },


        async getResultsByParticipant(participantId) {
            return cachedQuery('assessment_results:participant:' + participantId, async function () {
                var result = await supabaseClient
                    .from('assessment_results')
                    .select('*')
                    .eq('participant_id', participantId);

                if (result.error) {
                    handleErrorSilent('GET RESULTS BY PARTICIPANT', result.error);
                    return [];
                }

                return result.data || [];
            });
        },


        async saveAssessmentResult(resultData) {
            console.log('[DATA SERVICE] Saving assessment result...');

            var result = await supabaseClient
                .from('assessment_results')
                .insert(resultData)
                .select()
                .single();

            if (result.error) {
                handleError('SAVE ASSESSMENT RESULT', result.error);
            }

            cacheInvalidate('assessment_results:');

            return result.data;
        }

    };


    // ============================================
    // EXPOSE GLOBAL
    // ============================================

    window.DataService = DataService;

    console.log('[DATA SERVICE] Initialized (refactor fase 1, cache TTL: 30s)');

})();