// ============================================
// TALENTSCOPE CENTRAL DATA SERVICE
// ============================================
// Single source of truth:
// SUPABASE DATABASE
//
// LocalStorage hanya akan menjadi legacy cache,
// bukan database utama.
// ============================================


const DataService = {


    // ============================================
    // GENERAL HELPER
    // ============================================

    handleError(operation, error) {

        console.error(
            `[DATA SERVICE] ${operation} FAILED:`,
            error
        );

        throw error;
    },


    // ============================================
    // PROJECTS
    // ============================================

    async getProjects() {

        console.log('[DATA SERVICE] Loading projects...');

        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', {
                ascending: false
            });

        if (error) {

            this.handleError(
                'GET PROJECTS',
                error
            );

        }

        console.log(
            `[DATA SERVICE] Projects loaded: ${data.length}`
        );

        return data || [];
    },


    async getProjectById(projectId) {
    const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) this.handleError('GET PROJECT BY ID', error);

    return data;
},

async getProjectByCode(projectCode) {
    console.log('[DATA SERVICE] Loading project by code:', projectCode);

    const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('project_code', projectCode)
        .maybeSingle();

    if (error) {
        console.error('[DATA SERVICE] Get project by code error:', error);
        throw error;
    }

    if (!data) {
        console.warn(
            '[DATA SERVICE] Project not found with code:',
            projectCode
        );
        return null;
    }

    console.log('[DATA SERVICE] Project by code loaded:', data);

    return data;
},

    async createProject(projectData) {

    console.log(
        "[DATA SERVICE] Creating project..."
    );


    /* =========================================
       VALIDATE SUPABASE CLIENT
    ========================================= */

    if (
        !supabaseClient ||
        typeof supabaseClient.from !== "function"
    ) {

        throw new Error(
            "Supabase client tidak tersedia."
        );

    }


    /* =========================================
       INSERT PROJECT
    ========================================= */

    const {
        data,
        error
    } = await supabaseClient

        .from("projects")

        .insert([
            projectData
        ])

        .select()

        .single();


    /* =========================================
       HANDLE ERROR
    ========================================= */

    if (error) {

        console.error(
            "[DATA SERVICE] Create project error:",
            error
        );

        throw error;

    }


    console.log(
        "[DATA SERVICE] Project created successfully:",
        data
    );


    return data;

},

async createProjectAssessments(projectAssessmentData) {

    console.log(
        "[DATA SERVICE] Saving project assessments..."
    );


    /* =========================================
       VALIDATE CLIENT
    ========================================= */

    if (
        !supabaseClient ||
        typeof supabaseClient.from !== "function"
    ) {

        throw new Error(
            "Supabase client tidak tersedia."
        );

    }


    /* =========================================
       VALIDATE DATA
    ========================================= */

    if (
        !Array.isArray(projectAssessmentData) ||
        projectAssessmentData.length === 0
    ) {

        console.warn(
            "[DATA SERVICE] No project assessments to save"
        );

        return [];

    }


    /* =========================================
       INSERT RELATION
    ========================================= */

    const {
        data,
        error
    } = await supabaseClient

        .from("project_assessments")

        .insert(
            projectAssessmentData
        )

        .select();


    /* =========================================
       HANDLE ERROR
    ========================================= */

    if (error) {

        console.error(
            "[DATA SERVICE] Create project assessments error:",
            error
        );

        throw error;

    }


    console.log(
        "[DATA SERVICE] Project assessments saved:",
        data
    );


    return data || [];

},

// ============================================
// PROJECT ASSESSMENTS
// ============================================

async getProjectAssessments(projectId) {

    console.log(
        '[DATA SERVICE] Loading project assessments:',
        projectId
    );

    const { data, error } = await supabaseClient
        .from('project_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', {
            ascending: true
        });

    if (error) {

        this.handleError(
            'GET PROJECT ASSESSMENTS',
            error
        );

    }

    return data || [];
},


async updateProjectAssessment(
    assessmentRelationId,
    assessmentData
) {

    console.log(
        '[DATA SERVICE] Updating project assessment:',
        assessmentRelationId
    );

    const { data, error } = await supabaseClient
        .from('project_assessments')
        .update(assessmentData)
        .eq('id', assessmentRelationId)
        .select()
        .single();

    if (error) {

        this.handleError(
            'UPDATE PROJECT ASSESSMENT',
            error
        );

    }

    return data;
},

async deleteProjectAssessment(assessmentRelationId) {

    console.log('[DATA SERVICE] Removing project assessment:', assessmentRelationId);

    const { error } = await supabaseClient
        .from('project_assessments')
        .delete()
        .eq('id', assessmentRelationId);

    if (error) {
        this.handleError('DELETE PROJECT ASSESSMENT', error);
    }

    return true;
},

    async updateProject(projectId, projectData) {

        console.log(
            '[DATA SERVICE] Updating project:',
            projectId
        );

        const { data, error } = await supabaseClient
            .from('projects')
            .update(projectData)
            .eq('id', projectId)
            .select()
            .single();

        if (error) {

            this.handleError(
                'UPDATE PROJECT',
                error
            );

        }

        return data;
    },


    async deleteProject(projectId) {

        console.log(
            '[DATA SERVICE] Deleting project:',
            projectId
        );

        // Hapus dulu data anak (relasi) yang menunjuk ke project ini,
        // supaya delete project tidak gagal karena foreign key constraint
        // (misalnya project yang sudah punya peserta terdaftar).
        const { error: participantsError } = await supabaseClient
            .from('project_participants')
            .delete()
            .eq('project_id', projectId);

        if (participantsError) {
            this.handleError(
                'DELETE PROJECT (project_participants)',
                participantsError
            );
        }

        const { error: assessmentsError } = await supabaseClient
            .from('project_assessments')
            .delete()
            .eq('project_id', projectId);

        if (assessmentsError) {
            this.handleError(
                'DELETE PROJECT (project_assessments)',
                assessmentsError
            );
        }

        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) {

            this.handleError(
                'DELETE PROJECT',
                error
            );

        }

        return true;
    },


    // ============================================
    // PARTICIPANTS
    // ============================================

    async getParticipants() {

        console.log(
            '[DATA SERVICE] Loading participants...'
        );

        const { data, error } = await supabaseClient
            .from('participants')
            .select('*')
            .order('created_at', {
                ascending: false
            });

        if (error) {

            this.handleError(
                'GET PARTICIPANTS',
                error
            );

        }

        console.log(
            `[DATA SERVICE] Participants loaded: ${data.length}`
        );

        return data || [];
    },


    async getParticipantById(participantId) {

        const { data, error } = await supabaseClient
            .from('participants')
            .select('*')
            .eq('id', participantId)
            .single();

        if (error) {

            this.handleError(
                'GET PARTICIPANT BY ID',
                error
            );

        }

        return data;
    },

// ============================================
// GET PARTICIPANT BY CODE OR EMAIL
// ============================================

async getParticipantByCodeOrEmail(
    participantCode,
    email
) {

    console.log(
        '[DATA SERVICE] Finding participant:',
        participantCode,
        email
    );


    // ========================================
    // SEARCH BY PARTICIPANT CODE
    // ========================================

    if (participantCode) {

        const {
            data,
            error
        } = await supabaseClient
            .from('participants')
            .select('*')
            .eq(
                'participant_code',
                participantCode
            )
            .maybeSingle();


        if (error) {

            this.handleError(
                'GET PARTICIPANT BY CODE',
                error
            );

        }


        if (data) {

            return data;

        }

    }


    // ========================================
    // SEARCH BY EMAIL
    // ========================================

    if (email) {

        const {
            data,
            error
        } = await supabaseClient
            .from('participants')
            .select('*')
            .eq(
                'email',
                email
            )
            .maybeSingle();


        if (error) {

            this.handleError(
                'GET PARTICIPANT BY EMAIL',
                error
            );

        }


        if (data) {

            return data;

        }

    }


    return null;

},

    // ============================================
    // CREATE PARTICIPANT
    // ============================================

    async createParticipant(participantData) {

        console.log(
            '[DATA SERVICE] Creating participant...',
            participantData
        );


        const {
            data,
            error
        } = await supabaseClient

            .from('participants')

            .insert([
                participantData
            ])

            .select()

            .single();


        if (error) {

            this.handleError(
                'CREATE PARTICIPANT',
                error
            );

        }


        console.log(
            '[DATA SERVICE] Participant created:',
            data
        );


        return data;

    },


    // ============================================
    // UPDATE PARTICIPANT
    // ============================================

    async updateParticipant(
        participantId,
        participantData
    ) {

        console.log(
            '[DATA SERVICE] Updating participant:',
            participantId
        );


        const {
            data,
            error
        } = await supabaseClient

            .from('participants')

            .update(
                participantData
            )

            .eq(
                'id',
                participantId
            )

            .select()

            .single();


        if (error) {

            this.handleError(
                'UPDATE PARTICIPANT',
                error
            );

        }


        return data;

    },

    // ============================================
    // GET PARTICIPANTS BY PROJECT
    // ============================================

    async getParticipantsByProject(projectId) {

        console.log(
            '[DATA SERVICE] Loading participants by project:',
            projectId
        );


        const { data, error } = await supabaseClient
            .from('participants')
            .select('*')
            .eq(
                'project_id',
                projectId
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            );


        if (error) {

            this.handleError(
                'GET PARTICIPANTS BY PROJECT',
                error
            );

        }


        console.log(
            '[DATA SERVICE] Participants loaded:',
            data ? data.length : 0
        );


        return data || [];

    },

    // ============================================
    // GET PROJECT PARTICIPANTS
    // ============================================

    async getProjectParticipants(projectId) {

    console.log(
        '[DATA SERVICE] Loading project participants:',
        projectId
    );

    // Ambil relasi peserta dalam project
    const { data: relations, error: relationError } =
        await supabaseClient
            .from('project_participants')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', {
                ascending: false
            });

    if (relationError) {
        this.handleError(
            'GET PROJECT PARTICIPANTS',
            relationError
        );
    }

    if (!relations || relations.length === 0) {
        return [];
    }

    // Ambil semua ID peserta
    const participantIds = relations
        .map(item => item.participant_id)
        .filter(Boolean);

    if (participantIds.length === 0) {
        return relations.map(item => ({
            ...item,
            participant: null
        }));
    }

    // Ambil detail peserta
    const { data: participants, error: participantError } =
        await supabaseClient
            .from('participants')
            .select('*')
            .in('id', participantIds);

    if (participantError) {
        this.handleError(
            'GET PARTICIPANT DETAILS',
            participantError
        );
    }

    // Buat lookup agar cepat
    const participantMap = new Map(
        (participants || []).map(participant => [
            participant.id,
            participant
        ])
    );

    // Gabungkan data
    const result = relations.map(relation => ({
        ...relation,
        participant:
            participantMap.get(relation.participant_id) || null
    }));

    console.log(
        '[DATA SERVICE] Project participants loaded:',
        result
    );

    return result;
},


    // ============================================
    // GET PARTICIPANT COUNT PER PROJECT
    // ============================================
    // Mengambil jumlah peserta untuk SEMUA project
    // sekaligus dalam satu query (efisien, tidak query
    // per-project satu-satu). Dipakai untuk mengisi
    // kolom "Participants" di tabel Projects.
    //
    // Return: object { [project_id]: jumlahPeserta }
    // ============================================

    async getProjectParticipantCounts() {

        console.log(
            '[DATA SERVICE] Loading project participant counts...'
        );

        const { data, error } = await supabaseClient
            .from('project_participants')
            .select('project_id');

        if (error) {

            this.handleError(
                'GET PROJECT PARTICIPANT COUNTS',
                error
            );

        }

        const counts = {};

        (data || []).forEach(function (row) {

            if (!row || !row.project_id) {
                return;
            }

            counts[row.project_id] =
                (counts[row.project_id] || 0) + 1;

        });

        console.log(
            '[DATA SERVICE] Project participant counts loaded:',
            counts
        );

        return counts;

    },


    // ============================================
    // ADD PARTICIPANT TO PROJECT
    // ============================================

    async addParticipantToProject(
        projectId,
        participantId,
        participantStatus = 'registered'
    ) {

        console.log(
            '[DATA SERVICE] Adding participant to project...'
        );


        const {
            data,
            error
        } = await supabaseClient

            .from('project_participants')

            .insert([

                {

                    project_id:
                        projectId,

                    participant_id:
                        participantId,

                    status:
                        participantStatus,

                    registered_at:
                        new Date().toISOString()

                }

            ])

            .select()

            .single();


        if (error) {

            this.handleError(
                'ADD PARTICIPANT TO PROJECT',
                error
            );

        }


        console.log(
            '[DATA SERVICE] Participant added to project:',
            data
        );


        return data;

    },


    // ============================================
    // REMOVE PARTICIPANT FROM PROJECT
    // ============================================

    async removeParticipantFromProject(
        projectId,
        participantId
    ) {

        console.log(
            '[DATA SERVICE] Removing participant from project...'
        );


        const {
            error
        } = await supabaseClient

            .from('project_participants')

            .delete()

            .eq(
                'project_id',
                projectId
            )

            .eq(
                'participant_id',
                participantId
            );


        if (error) {

            this.handleError(
                'REMOVE PARTICIPANT FROM PROJECT',
                error
            );

        }


        return true;

    },



    // ============================================
    // ASSESSMENTS
    // ============================================

    async getAssessments() {

        console.log('[DATA SERVICE] Loading assessments...');

        /*
         * Primary query keeps the existing schema untouched.
         * Some deployments do not have created_at exposed on the catalog table,
         * so retry without ordering before reporting an error.
         */
        let result = await supabaseClient
            .from('assessments')
            .select('*')
            .order('created_at', { ascending: false });

        if (result.error) {
            console.warn('[DATA SERVICE] Ordered assessment query failed, retrying without order:', result.error);
            result = await supabaseClient
                .from('assessments')
                .select('*');
        }

        if (result.error) {
            this.handleError('GET ASSESSMENTS', result.error);
        }

        const data = Array.isArray(result.data) ? result.data : [];

        console.log(`[DATA SERVICE] Assessments loaded: ${data.length}`);

        return data;
    },


    async getAssessmentById(assessmentId) {

        const { data, error } = await supabaseClient
            .from('assessments')
            .select('*')
            .eq('id', assessmentId)
            .single();

        if (error) {

            this.handleError(
                'GET ASSESSMENT BY ID',
                error
            );

        }

        return data;
    },


    async createAssessment(assessmentData) {

        console.log(
            '[DATA SERVICE] Creating assessment...'
        );

        const { data, error } = await supabaseClient
            .from('assessments')
            .insert([assessmentData])
            .select()
            .single();

        if (error) {

            this.handleError(
                'CREATE ASSESSMENT',
                error
            );

        }

        console.log(
            '[DATA SERVICE] Assessment created successfully:',
            data
        );

        return data;
    },


    async updateAssessment(assessmentId, assessmentData) {

        console.log(
            '[DATA SERVICE] Updating assessment:',
            assessmentId
        );

        const { data, error } = await supabaseClient
            .from('assessments')
            .update(assessmentData)
            .eq('id', assessmentId)
            .select()
            .single();

        if (error) {

            this.handleError(
                'UPDATE ASSESSMENT',
                error
            );

        }

        return data;
    },


    async deleteAssessment(assessmentId) {

        console.log(
            '[DATA SERVICE] Deleting assessment:',
            assessmentId
        );

        const { error } = await supabaseClient
            .from('assessments')
            .delete()
            .eq('id', assessmentId);

        if (error) {

            this.handleError(
                'DELETE ASSESSMENT',
                error
            );

        }

        return true;
    },


    // ============================================
    // ASSESSMENT RESULTS
    // ============================================

    async getAssessmentResults() {

        console.log(
            '[DATA SERVICE] Loading assessment results...'
        );

        const { data, error } = await supabaseClient
            .from('assessment_results')
            .select('*')
            .order('created_at', {
                ascending: false
            });

        if (error) {

            this.handleError(
                'GET ASSESSMENT RESULTS',
                error
            );

        }

        console.log(
            `[DATA SERVICE] Results loaded: ${data.length}`
        );

        return data || [];
    },


    async getResultsByParticipant(participantId) {

        const { data, error } = await supabaseClient
            .from('assessment_results')
            .select('*')
            .eq('participant_id', participantId);

        if (error) {

            this.handleError(
                'GET RESULTS BY PARTICIPANT',
                error
            );

        }

        return data || [];
    },


    async saveAssessmentResult(resultData) {

        console.log(
            '[DATA SERVICE] Saving assessment result...',
            resultData
        );

        const { data, error } = await supabaseClient
            .from('assessment_results')
            .insert(resultData)
            .select()
            .single();

        if (error) {

            this.handleError(
                'SAVE ASSESSMENT RESULT',
                error
            );

        }

        return data;
    }


};


// ============================================
// MAKE DATA SERVICE GLOBAL
// ============================================

window.DataService = DataService;


console.log(
    '[DATA SERVICE] Initialized successfully'
);