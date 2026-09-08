// ============================================
// SUPABASE CLIENT
// Centralized Supabase Connection
// ============================================

// Pastikan library Supabase sudah dimuat sebelum file ini dijalankan.
// Contoh di HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ============================================
// SUPABASE CONFIGURATION
// ============================================

// GANTI dengan Project URL Supabase Anda
const SUPABASE_URL = 'https://nixmychfhsnsvymkuxtm.supabase.co';

// GANTI dengan Supabase ANON KEY Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peG15Y2hmaHNuc3Z5bWt1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzU0MzMsImV4cCI6MjEwMzA1MTQzM30.Ak9SMJkhwtTlo8zIcHha8uecF4ayz172zIwGbdliNm4';


// ============================================
// CREATE SUPABASE CLIENT
// ============================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================
// CONNECTION TEST
// ============================================

async function testSupabaseConnection() {

    try {

        const { data, error } = await supabaseClient
            .from('projects')
            .select('id')
            .limit(1);

        if (error) {
            console.error(
                '[SUPABASE] Connection failed:',
                error
            );

            return false;
        }

        console.log(
            '[SUPABASE] Connection successful'
        );

        return true;

    } catch (error) {

        console.error(
            '[SUPABASE] Unexpected connection error:',
            error
        );

        return false;
    }
}


// ============================================
// GLOBAL AVAILABILITY CHECK
// ============================================

window.supabaseClient = supabaseClient;

console.log(
    '[SUPABASE] Client initialized successfully'
);
// ============================================
// TEST READ SUPABASE DATA
// ============================================

async function testSupabaseData() {

    try {

        console.log('====================================');
        console.log('[SUPABASE TEST] Starting data test...');
        console.log('====================================');


        // TEST PROJECTS
        const { data: projects, error: projectsError } =
            await supabaseClient
                .from('projects')
                .select('*');

        if (projectsError) {
            console.error(
                '[PROJECTS ERROR]',
                projectsError
            );
        } else {
            console.log(
                '[PROJECTS SUCCESS]',
                projects
            );

            console.log(
                '[PROJECTS COUNT]',
                projects.length
            );
        }


        // TEST PARTICIPANTS
        const { data: participants, error: participantsError } =
            await supabaseClient
                .from('participants')
                .select('*');

        if (participantsError) {
            console.error(
                '[PARTICIPANTS ERROR]',
                participantsError
            );
        } else {
            console.log(
                '[PARTICIPANTS SUCCESS]',
                participants
            );

            console.log(
                '[PARTICIPANTS COUNT]',
                participants.length
            );
        }


        // TEST ASSESSMENTS
        const { data: assessments, error: assessmentsError } =
            await supabaseClient
                .from('assessments')
                .select('*');

        if (assessmentsError) {
            console.error(
                '[ASSESSMENTS ERROR]',
                assessmentsError
            );
        } else {
            console.log(
                '[ASSESSMENTS SUCCESS]',
                assessments
            );

            console.log(
                '[ASSESSMENTS COUNT]',
                assessments.length
            );
        }


        // TEST ASSESSMENT RESULTS
        const { data: results, error: resultsError } =
            await supabaseClient
                .from('assessment_results')
                .select('*');

        if (resultsError) {
            console.error(
                '[RESULTS ERROR]',
                resultsError
            );
        } else {
            console.log(
                '[RESULTS SUCCESS]',
                results
            );

            console.log(
                '[RESULTS COUNT]',
                results.length
            );
        }


        console.log('====================================');
        console.log('[SUPABASE TEST] Finished');
        console.log('====================================');


        return {
            projects,
            participants,
            assessments,
            results
        };

    } catch (error) {

        console.error(
            '[SUPABASE TEST] Unexpected error:',
            error
        );

    }

}


// Make available globally for browser console

window.testSupabaseData = testSupabaseData;