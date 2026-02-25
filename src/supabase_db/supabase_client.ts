import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ixlubieupnscehotjato.supabase.co/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bHViaWV1cG5zY2Vob3RqYXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDU3ODIsImV4cCI6MjA4NjEyMTc4Mn0.30MgcGizV7_GCgIJXY-bfgGIK_A3uvNf89YnaexP-gE",
);

export default supabase;
