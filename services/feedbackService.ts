import { supabase } from "@/lib/supabase";

export interface FeedbackEligibleMatch {
  match_id: string;
  partner_name: string;
  meeting_date: string;
  start_time: string;
  coffeePlace: string;
}

export const feedbackService = {
  // Check for matches that are eligible for feedback (2+ hours after start time)
  async getEligibleMatchesForFeedback(
    userId: string,
  ): Promise<FeedbackEligibleMatch[]> {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000);

      // Get confirmed matches where the user hasn't provided feedback yet
      const { data: matches, error: matchError } = await supabase
        .from("matching")
        .select(
          `
          match_id,
          user1_id,
          user2_id,
          meeting_date,
          start_time,
          status,
          meeting_location
        `,
        )
        .eq("status", "confirmed")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .lte("meeting_date", twoHoursAgo.toISOString().split("T")[0]);

      if (matchError) throw matchError;

      if (!matches || matches.length === 0) {
        return [];
      }

      // Filter matches that happened more than 2 hours ago
      const eligibleMatches = matches.filter((match) => {
        const meetingDateTime = new Date(
          `${match.meeting_date}T${match.start_time}`,
        );
        const twoHoursAfterMeeting = new Date(
          meetingDateTime.getTime() + 2 * 60 * 60 * 1000,
        );
        return now >= twoHoursAfterMeeting;
      });

      if (eligibleMatches.length === 0) {
        return [];
      }

      // Check which matches already have feedback from this user
      const matchIds = eligibleMatches.map((match) => match.match_id);
      const { data: existingFeedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("match_id")
        .in("match_id", matchIds);

      if (feedbackError) throw feedbackError;

      const feedbackGivenMatchIds = new Set(
        existingFeedback?.map((f) => f.match_id) || [],
      );

      // Filter out matches that already have feedback
      const matchesNeedingFeedback = eligibleMatches.filter(
        (match) => !feedbackGivenMatchIds.has(match.match_id),
      );

      // Get partner names for remaining matches
      const results: FeedbackEligibleMatch[] = [];

      for (const match of matchesNeedingFeedback) {
        const partnerId =
          match.user1_id === userId ? match.user2_id : match.user1_id;

        const { data: partnerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", partnerId)
          .single();

        if (!profileError && partnerProfile) {
          results.push({
            match_id: match.match_id,
            partner_name: partnerProfile.name || "Unknown",
            meeting_date: match.meeting_date,
            start_time: match.start_time,
            coffeePlace: match.meeting_location.split("|||")[0]
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error getting eligible matches for feedback:", error);
      return [];
    }
  },

  // Mark feedback as requested to avoid showing multiple times
  async markFeedbackRequested(matchId: string): Promise<void> {
    try {
      const { error } = await supabase.from("feedback_requests").insert([
        {
          match_id: matchId,
          requested_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking feedback as requested:", error);
    }
  },

  // Check if feedback was already requested for this match
  async isFeedbackAlreadyRequested(matchId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("feedback_requests")
        .select("match_id")
        .eq("match_id", matchId)
        .single();

      if (error && error.code === "PGRST116") {
        // No rows returned, feedback not requested yet
        return false;
      }

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking feedback request status:", error);
      return true; // Assume already requested to avoid spam
    }
  },
};
