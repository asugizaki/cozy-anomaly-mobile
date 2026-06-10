import * as functions from 'firebase-functions';

export const claimMissionReward = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be signed in'
      );
    }

    const userId = context.auth.uid;

    // Validate mission completion
    // Check duplicate claims
    // Award XP/coins
    // Create transaction record

    return {
      success: true,
      xpAwarded: 100,
      coinsAwarded: 25,
    };
  }
);
