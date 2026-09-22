Deno.serve(async (req) => {
    return new Response(
        JSON.stringify({ 
            message: "Hello from Supabase!",
            timestamp: new Date().toISOString()
        }),
        { 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        }
    );
});