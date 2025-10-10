const { createClient } = require("@supabase/supabase-js");

async function testSupabase() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "placeholder_url",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key"
        );

        console.log("Supabase client created successfully");
        console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "not configured");
        console.log("ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "not configured");

    } catch (error) {
        console.error("Supabase test failed:", error);
    }
}

testSupabase();
