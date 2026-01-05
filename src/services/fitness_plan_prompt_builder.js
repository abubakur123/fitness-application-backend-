class FitnessPlanPromptBuilder {
  /* =========================
     PROMPT BUILDER
  ========================== */

  buildPrompt(profile) {
    let planType;
    let programData;
    let basePrompt = this._baseUserInfo(profile);
    let adaptiveConstraints = '';

    if (profile.adaptiveProfile) {
      planType = 'adaptive';
      programData = profile.adaptiveProfile;
      
      // Add adaptive-specific constraints
      adaptiveConstraints = this._adaptiveConstraints(programData);
      
      basePrompt += `
**Adaptive Program Details:**
- Affected Limbs: ${programData.affectedLimbs || 'Not specified'}
- Purposes: ${Array.isArray(programData.purposes) ? programData.purposes.join(', ') : 'Not specified'}
${adaptiveConstraints}
`;
    }

    if (profile.goalBasedProgram) {
      planType = 'goalBased';
      programData = profile.goalBasedProgram;

      basePrompt += `
**Goal-Based Program Details:**
- Primary Goal: ${programData.primaryGoal || 'Not specified'}
- Fitness Level: ${programData.fitnessLevel || 'Not specified'}
- Target Areas: ${Array.isArray(programData.targetAreas) ? programData.targetAreas.join(', ') : 'None'}
- Equipment: ${Array.isArray(programData.availableEquipment) ? programData.availableEquipment.join(', ') : 'None'}
`;
    }

    const prompt = `
${basePrompt}

${this._sevenDayConstraints()}

${this._exerciseAndNutritionRequirements(planType === 'adaptive')}

${this._outputFormat()}
`;

    return { planType, programData, prompt };
  }

  /* =========================
     BASE USER INFO
  ========================== */

  _baseUserInfo(profile) {
    return `
Create a personalized fitness plan using the details below.

**Personal Information:**
- Gender: ${profile.gender || 'Not specified'}
- Age: ${profile.age || 'Not specified'}
- Height: ${profile.heightCm || 'Not specified'} cm
- Current Weight: ${profile.currentWeightKg || 'Not specified'} kg
- Target Weight: ${profile.targetWeightKg || 'Not specified'} kg
- Commitment Level: ${profile.commitment || 'Not specified'}
- Workout Days: ${Array.isArray(profile.workoutDays) ? profile.workoutDays.join(', ') : 'Not specified'}
`;
  }

  /* =========================
     ADAPTIVE CONSTRAINTS
  ========================== */

  _adaptiveConstraints(programData) {
    const affectedLimbs = programData.affectedLimbs?.toLowerCase() || '';
    
    let constraints = '\n**CRITICAL ADAPTIVE CONSTRAINTS:**\n';
    
    // Add specific constraints based on affected limbs
    if (affectedLimbs.includes('arm') || affectedLimbs.includes('upper body') || affectedLimbs.includes('shoulder')) {
      constraints += `- User has upper body limitations: ${affectedLimbs}
- AVOID exercises that put pressure on the affected arm(s)
- Use seated or supported exercises when needed
- Focus on range-of-motion exercises within pain-free limits
- Include unilateral exercises for unaffected side if appropriate\n`;
    }
    
    if (affectedLimbs.includes('leg') || affectedLimbs.includes('knee') || affectedLimbs.includes('lower body') || affectedLimbs.includes('foot')) {
      constraints += `- User has lower body limitations: ${affectedLimbs}
- ABSOLUTELY NO squats, lunges, or exercises that require full weight-bearing on affected leg(s)
- Use seated or non-weight-bearing exercises
- Focus on chair exercises, resistance bands, or water-based exercise simulations
- Include isometric contractions if safe\n`;
    }
    
    if (affectedLimbs.includes('back') || affectedLimbs.includes('spine') || affectedLimbs.includes('core')) {
      constraints += `- User has back/core limitations: ${affectedLimbs}
- AVOID exercises that compress the spine
- No heavy lifting or twisting motions
- Focus on gentle core activation and stabilization
- Use supported positions (leaning forward, seated)\n`;
    }
    
    // General adaptive exercise rules
    constraints += `
**GENERAL ADAPTIVE RULES:**
- Only include exercises that are SAFE for the specific limitations mentioned
- If unsure about an exercise's safety, DO NOT include it
- All exercises must be modifiable or have clear alternatives
- Focus on functional movements that support daily activities
- Progress slowly with emphasis on form over intensity
- Include rest periods as needed within each session`;

    return constraints;
  }

  /* =========================
     SEVEN DAY CONSTRAINTS
  ========================== */

  _sevenDayConstraints() {
    return `
IMPORTANT CONSTRAINTS:
- Create a plan for EXACTLY 7 days (Day 1 to Day 7)
- Do NOT exceed 7 days
- Include at least 1 active recovery day
`;
  }

  /* =========================
     EXERCISE & NUTRITION REQUIREMENTS
  ========================== */

  _exerciseAndNutritionRequirements(isAdaptive = false) {
    let requirements = `
CONTENT REQUIREMENTS:

EXERCISES:
- Explain WHAT the exercise is
- Step-by-step HOW TO DO IT
- Form tips & common mistakes
- Sets/reps or duration
`;

    // Add adaptive-specific requirements
    if (isAdaptive) {
      requirements += `
**ADAPTIVE EXERCISE REQUIREMENTS:**
- Each exercise MUST be modified for the user's specific limitations
- Clearly state modifications for affected limbs
- Include alternative exercises if certain movements aren't possible
- Focus on seated or supported positions when necessary
- Emphasize safety and pain-free range of motion
- Do NOT suggest exercises that could aggravate the condition
`;
    }

    requirements += `
WORKOUT:
- Estimated calories burned per day
- Explain workout intensity
- Note: Adaptive workouts may burn fewer calories - be realistic

NUTRITION:
- Daily meals: Breakfast, Lunch, Dinner, Snack
- Calories per meal
- Total daily calories
- Explain why nutrition supports recovery and adaptation

SAFETY:
- Beginner-friendly language
- Warm-up & cool-down included
- Injury safety notes
- Stop-immediately warnings for pain or discomfort
`;

    return requirements;
  }

  /* =========================
     OUTPUT FORMAT
  ========================== */

  _outputFormat() {
    return `
OUTPUT FORMAT:
You MUST respond with VALID JSON ONLY. No markdown, no code blocks, no extra text.

Return a JSON object with this EXACT structure:

{
  "overview": {
    "totalDays": 7,
    "activeDays": <number>,
    "restDays": <number>,
    "estimatedWeeklyCaloriesBurned": <number>,
    "adaptiveNotes": ["Adaptive plan for users with physical limitations", "Exercises modified for safety"],
    "limitationsConsidered": ["List of specific limitations addressed"]
  },
  "days": [
    {
      "day": 1,
      "type": "workout" or "rest",
      "workout": {
        "focus": "string",
        "caloriesBurned": <number>,
        "intensity": "low/medium/high",
        "adaptiveModifications": "string describing how exercises are modified",
        "warmup": {
          "description": "string",
          "duration": "string"
        },
        "exercises": [
          {
            "name": "string",
            "description": "string",
            "steps": ["step1", "step2", "step3"],
            "setsReps": "string",
            "modifications": ["modification for affected limb", "alternative if needed"],
            "tips": ["tip1", "tip2"],
            "safetyWarning": "string (if applicable)"
          }
        ],
        "cooldown": {
          "description": "string",
          "duration": "string"
        }
      },
      "nutrition": {
        "breakfast": {
          "description": "string",
          "calories": <number>
        },
        "lunch": {
          "description": "string",
          "calories": <number>
        },
        "dinner": {
          "description": "string",
          "calories": <number>
        },
        "snack": {
          "description": "string",
          "calories": <number>
        },
        "totalCalories": <number>,
        "explanation": "string"
      }
    }
  ],
  "safetyNotes": ["note1", "note2", "note3"],
  "emergencyStopSigns": ["Sharp pain in affected area", "Dizziness", "Loss of balance"]
}

CRITICAL: Return ONLY the JSON object. No text before or after.
`;
  }

  /* =========================
     SYSTEM PROMPT
  ========================== */

  getSystemPrompt() {
    return `You are a certified adaptive fitness specialist and physical therapist. 
    You design safe, modified exercise programs for people with physical limitations.
    
    RULES:
    1. NEVER suggest exercises that could harm someone with their specific limitations
    2. If a user has leg limitations: NO squats, lunges, jumping, or weight-bearing exercises
    3. If a user has arm limitations: NO push-ups, planks, or exercises requiring arm support
    4. Always provide seated or supported alternatives
    5. Focus on pain-free range of motion and functional movements
    6. Respond with valid JSON only, no markdown`;
  }
}

module.exports = new FitnessPlanPromptBuilder();