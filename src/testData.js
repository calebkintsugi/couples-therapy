// Sample couples for each category with realistic responses

export const testCouples = {
  infidelity_her: {
    partnerA: {
      name: 'Rachel',
      role: 'unfaithful',
      scale: [
        { id: 'trust', answer: '3' },
        { id: 'commitment', answer: '5' },
        { id: 'transparency', answer: '4' },
        { id: 'emotional_safety', answer: '2' },
        { id: 'empathy', answer: '2' },
      ],
      text: [
        { id: 'tangible_action', answer: 'I need him to stop punishing me with silence. When he shuts down for days, I feel like I\'m already gone in his mind.' },
        { id: 'biggest_wall', answer: 'His anger scares me. I know I deserve some of it, but when he yells, I shut down completely. We can\'t talk when he\'s like that.' },
        { id: 'unspoken', answer: 'The affair happened because I felt invisible for years. I\'m not excusing it, but I need him to understand I was drowning before it happened.' },
        { id: 'vulnerability', answer: 'I need to know he actually wants to be here, not just staying for the kids or out of pride. I need to feel chosen, not tolerated.' },
        { id: 'understand_me', answer: 'I wish he understood that my guilt is crushing me. I don\'t need him to remind me what I did—I live with it every second of every day.' },
      ],
    },
    partnerB: {
      name: 'Daniel',
      role: 'betrayed',
      scale: [
        { id: 'trust', answer: '1' },
        { id: 'commitment', answer: '3' },
        { id: 'transparency', answer: '3' },
        { id: 'emotional_safety', answer: '2' },
        { id: 'empathy', answer: '2' },
      ],
      text: [
        { id: 'tangible_action', answer: 'I need complete access to her phone and accounts. Not forever—but right now I need to verify. I can\'t just take her word for things anymore.' },
        { id: 'biggest_wall', answer: 'The images in my head. I can\'t stop picturing them together. It hits me randomly—driving, at work, trying to sleep. I don\'t know how to make it stop.' },
        { id: 'unspoken', answer: 'Part of me wants her to hurt as much as I do. I know that\'s not healthy, but I\'m so angry. She got to feel desired while I got humiliated.' },
        { id: 'vulnerability', answer: 'I need her to stop defending herself and just sit in my pain with me. Every time she explains "why," it feels like she\'s minimizing what she did.' },
        { id: 'understand_me', answer: 'I wish she understood that my anger is the only thing holding me together right now. If I stop being angry, I\'ll fall apart completely.' },
      ],
    },
  },

  infidelity: {
    partnerA: {
      name: 'Sarah',
      role: 'betrayed',
      scale: [
        { id: 'trust', answer: '2' },
        { id: 'commitment', answer: '4' },
        { id: 'transparency', answer: '3' },
        { id: 'emotional_safety', answer: '2' },
        { id: 'empathy', answer: '2' },
      ],
      text: [
        { id: 'tangible_action', answer: 'I need him to check in with me during the day without me having to ask. Even a simple text saying he\'s thinking of me would help me feel like I matter.' },
        { id: 'biggest_wall', answer: 'The lies. It\'s not even the affair itself anymore—it\'s that he looked me in the eyes and lied for months. I don\'t know how to trust anything he says now.' },
        { id: 'unspoken', answer: 'Sometimes I wonder if I\'m only staying because I\'m scared of being alone and starting over at 42. I haven\'t told him that.' },
        { id: 'vulnerability', answer: 'I need to see consistent effort over time, not just bursts of attention when he senses I\'m pulling away. I need to know this matters to him even on ordinary days.' },
        { id: 'understand_me', answer: 'I wish he understood that my anger isn\'t me trying to punish him—it\'s me still processing. When I bring it up, I\'m not attacking. I\'m trying to heal.' },
      ],
    },
    partnerB: {
      name: 'Michael',
      role: 'unfaithful',
      scale: [
        { id: 'trust', answer: '4' },
        { id: 'commitment', answer: '5' },
        { id: 'transparency', answer: '4' },
        { id: 'emotional_safety', answer: '3' },
        { id: 'empathy', answer: '3' },
      ],
      text: [
        { id: 'tangible_action', answer: 'I wish she would let me hold her sometimes without pulling away. Physical touch used to be how we connected and I miss that closeness.' },
        { id: 'biggest_wall', answer: 'She says she wants to move forward but then won\'t let me forget the past. I feel like I\'m being punished forever and nothing I do will ever be enough.' },
        { id: 'unspoken', answer: 'I\'m terrified that I broke something that can\'t be fixed. And I\'m scared that if she knew how much shame I carry, she\'d see me as weak.' },
        { id: 'vulnerability', answer: 'I need her to give me some sign that progress is possible. Even small acknowledgments that I\'m trying would help me keep going.' },
        { id: 'understand_me', answer: 'I wish she understood that my defensiveness comes from shame, not dismissal. When I get quiet or pull back, it\'s because I hate myself, not because I don\'t care.' },
      ],
    },
  },

  communication: {
    partnerA: {
      name: 'Jessica',
      role: null,
      scale: [
        { id: 'heard', answer: '2' },
        { id: 'safe_to_speak', answer: '2' },
        { id: 'resolution', answer: '2' },
        { id: 'escalation', answer: '2' },
        { id: 'repair', answer: '3' },
      ],
      text: [
        { id: 'avoid_topic', answer: 'His relationship with his mother. Every time I bring up boundaries, he accuses me of trying to isolate him from his family.' },
        { id: 'wish_understood', answer: 'When I get quiet, I\'m not giving him the silent treatment—I\'m trying not to say something I\'ll regret. I need time to process before I can talk.' },
        { id: 'own_pattern', answer: 'I know I interrupt him. I get so anxious that he won\'t hear my point that I jump in before he finishes. It makes him feel dismissed.' },
        { id: 'recent_conversation', answer: 'Last week we argued about vacation plans. It started small but ended with him saying I never consider his feelings. I wish I had paused instead of defending myself.' },
        { id: 'understand_me', answer: 'I wish he understood that I\'m not trying to win arguments—I\'m trying to feel heard. When he gets defensive, I feel like my concerns don\'t matter.' },
      ],
    },
    partnerB: {
      name: 'David',
      role: null,
      scale: [
        { id: 'heard', answer: '3' },
        { id: 'safe_to_speak', answer: '2' },
        { id: 'resolution', answer: '2' },
        { id: 'escalation', answer: '2' },
        { id: 'repair', answer: '2' },
      ],
      text: [
        { id: 'avoid_topic', answer: 'How much time she spends on her phone when we\'re together. I feel like I\'m competing with her social media for attention.' },
        { id: 'wish_understood', answer: 'I need to think before I respond. When she rapid-fires questions at me, I shut down. It\'s not stonewalling—I genuinely need processing time.' },
        { id: 'own_pattern', answer: 'I raise my voice when I feel unheard. I know it scares her and shuts down the conversation, but in the moment I can\'t seem to stop.' },
        { id: 'recent_conversation', answer: 'She asked about my day and I gave a short answer. She got upset that I don\'t share. I wish I\'d realized she was reaching out, not interrogating me.' },
        { id: 'understand_me', answer: 'I wish she understood that when I say "I don\'t know," I really don\'t know. I\'m not being evasive—I\'m still figuring out how I feel.' },
      ],
    },
  },

  emotional_distance: {
    partnerA: {
      name: 'Emily',
      role: null,
      scale: [
        { id: 'connection', answer: '2' },
        { id: 'priority', answer: '2' },
        { id: 'quality_time', answer: '2' },
        { id: 'loneliness', answer: '2' },
        { id: 'share_life', answer: '2' },
      ],
      text: [
        { id: 'when_close', answer: 'Before we had kids. We used to stay up late talking about everything and nothing. Now we\'re just managing logistics.' },
        { id: 'missing', answer: 'Being his person. He used to tell me things first—good news, bad days, random thoughts. Now I hear about his life secondhand or not at all.' },
        { id: 'reconnect', answer: 'I\'d love for him to plan something for us. Not expensive—just something that shows he thought about what I might enjoy.' },
        { id: 'barrier_to_reaching', answer: 'Fear of rejection. The last few times I\'ve tried to initiate connection, he was distracted or tired. I\'ve stopped trying to avoid feeling unwanted.' },
        { id: 'understand_me', answer: 'I wish he understood that when I ask "how was your day," I\'m not making small talk. I\'m trying to find a way back in.' },
      ],
    },
    partnerB: {
      name: 'Ryan',
      role: null,
      scale: [
        { id: 'connection', answer: '3' },
        { id: 'priority', answer: '3' },
        { id: 'quality_time', answer: '2' },
        { id: 'loneliness', answer: '3' },
        { id: 'share_life', answer: '3' },
      ],
      text: [
        { id: 'when_close', answer: 'Our first apartment. We had nothing but each other. Now we have everything we thought we wanted and somehow feel further apart.' },
        { id: 'missing', answer: 'Her looking at me the way she used to. Like I was interesting. Like she chose me on purpose, not just by default.' },
        { id: 'reconnect', answer: 'If she came to bed at the same time as me instead of staying up alone. Those late night conversations we used to have—I miss them.' },
        { id: 'barrier_to_reaching', answer: 'I honestly don\'t know what she wants anymore. When I try, it feels like it\'s never the right thing. So I\'ve stopped guessing.' },
        { id: 'understand_me', answer: 'I wish she understood that I feel the distance too. I\'m not content with how things are. I just don\'t know how to fix it.' },
      ],
    },
  },

  life_stress: {
    partnerA: {
      name: 'Amanda',
      role: null,
      scale: [
        { id: 'team', answer: '3' },
        { id: 'support', answer: '2' },
        { id: 'burden', answer: '2' },
        { id: 'stress_spillover', answer: '2' },
        { id: 'coping', answer: '2' },
      ],
      text: [
        { id: 'biggest_stressor', answer: 'His job uncertainty. He might get laid off and we have a mortgage and two kids. I\'m terrified but I can\'t show it because he\'s already spiraling.' },
        { id: 'need_from_partner', answer: 'I need him to handle things without me having to ask or manage. I\'m exhausted from being the one who remembers everything.' },
        { id: 'own_contribution', answer: 'I know I catastrophize. When I\'m stressed, I list every worst-case scenario out loud, which makes his anxiety worse.' },
        { id: 'support_wish', answer: 'I wish he knew that when I\'m overwhelmed, I don\'t need solutions—I need him to say "that sounds really hard" and maybe just hold me.' },
        { id: 'understand_me', answer: 'I wish he understood that my need to control things comes from fear, not from thinking he\'s incompetent.' },
      ],
    },
    partnerB: {
      name: 'Chris',
      role: null,
      scale: [
        { id: 'team', answer: '3' },
        { id: 'support', answer: '3' },
        { id: 'burden', answer: '3' },
        { id: 'stress_spillover', answer: '2' },
        { id: 'coping', answer: '2' },
      ],
      text: [
        { id: 'biggest_stressor', answer: 'Work. I might lose my job and I feel like a failure. I\'m supposed to provide for my family and I can\'t even guarantee that.' },
        { id: 'need_from_partner', answer: 'Space to figure things out without feeling like she\'s watching and judging. Her worry feels like pressure, even when she means well.' },
        { id: 'own_contribution', answer: 'I withdraw when stressed. I know she needs connection but I don\'t have anything left to give. So I hide in the garage or stay late at work.' },
        { id: 'support_wish', answer: 'I wish she knew that when I say "I\'m fine," I\'m not shutting her out—I\'m trying not to burden her with problems I should be able to handle.' },
        { id: 'understand_me', answer: 'I wish she understood that my silence isn\'t indifference. I\'m scared too. I just don\'t know how to say it without making things worse.' },
      ],
    },
  },

  intimacy: {
    partnerA: {
      name: 'Megan',
      role: null,
      scale: [
        { id: 'desire', answer: '2' },
        { id: 'initiation', answer: '2' },
        { id: 'rejection', answer: '2' },
        { id: 'communication', answer: '2' },
        { id: 'emotional_connection', answer: '3' },
      ],
      text: [
        { id: 'barrier', answer: 'I\'m exhausted. By the time the kids are in bed and the house is quiet, I have nothing left. And honestly, I don\'t feel desirable anymore.' },
        { id: 'desire_for', answer: 'More buildup. I need to feel wanted throughout the day, not just at 10pm. A flirty text, a genuine compliment, something that makes me feel seen.' },
        { id: 'unsaid', answer: 'Sometimes I fake it just to get it over with. I hate admitting that, but it\'s true. I don\'t know how to tell him what I actually need.' },
        { id: 'change_over_time', answer: 'It used to feel exciting and spontaneous. Now it feels like another chore on my to-do list. I miss wanting it.' },
        { id: 'understand_me', answer: 'I wish he understood that my lack of desire isn\'t about him. I\'m touched out, stressed, and disconnected from my own body.' },
      ],
    },
    partnerB: {
      name: 'Jason',
      role: null,
      scale: [
        { id: 'desire', answer: '2' },
        { id: 'initiation', answer: '3' },
        { id: 'rejection', answer: '2' },
        { id: 'communication', answer: '2' },
        { id: 'emotional_connection', answer: '3' },
      ],
      text: [
        { id: 'barrier', answer: 'The constant rejection. I\'ve stopped initiating because it hurts too much to be turned down. I feel unwanted and it\'s killing my confidence.' },
        { id: 'desire_for', answer: 'For her to initiate sometimes. To feel like she actually wants me, not just tolerates me. I want to feel desired too.' },
        { id: 'unsaid', answer: 'I miss her so much it hurts. But I\'ve stopped saying it because I don\'t want to pressure her. So I just... wait.' },
        { id: 'change_over_time', answer: 'We used to not be able to keep our hands off each other. Now we go weeks without touching. I don\'t know when we became roommates.' },
        { id: 'understand_me', answer: 'I wish she understood that physical intimacy is how I feel loved and connected. Without it, I feel like we\'re just coparenting, not partners.' },
      ],
    },
  },

  strengthening: {
    partnerA: {
      name: 'Lauren',
      role: null,
      scale: [
        { id: 'values', answer: '4' },
        { id: 'conflict', answer: '4' },
        { id: 'family', answer: '3' },
        { id: 'finances', answer: '3' },
        { id: 'growth', answer: '4' },
      ],
      text: [
        { id: 'concern', answer: 'We\'ve never really been tested. Everything has been relatively easy so far. I worry we don\'t know how we\'ll handle real adversity.' },
        { id: 'conversation_needed', answer: 'Kids—when, how many, and what happens if one of us changes our mind. We\'ve danced around it but never really gone deep.' },
        { id: 'strength', answer: 'We genuinely like each other. Even after three years, I still want to tell him about my day and hear about his.' },
        { id: 'dream_unsupported', answer: 'I want to take a year off to travel before we have kids. I don\'t think he takes it seriously—he sees it as impractical.' },
        { id: 'understand_me', answer: 'I wish he understood that my need for adventure isn\'t restlessness—it\'s how I feel alive. I need him to dream with me, not just plan.' },
      ],
    },
    partnerB: {
      name: 'Matt',
      role: null,
      scale: [
        { id: 'values', answer: '4' },
        { id: 'conflict', answer: '3' },
        { id: 'family', answer: '4' },
        { id: 'finances', answer: '4' },
        { id: 'growth', answer: '4' },
      ],
      text: [
        { id: 'concern', answer: 'I sometimes wonder if we\'re together because it\'s comfortable or because we\'re truly right for each other. How do you know the difference?' },
        { id: 'conversation_needed', answer: 'What happens if our careers pull us in different directions. We\'re both ambitious—I don\'t know how we\'d handle competing priorities.' },
        { id: 'strength', answer: 'We communicate well. When something bothers one of us, we actually talk about it instead of letting it fester.' },
        { id: 'dream_unsupported', answer: 'I\'ve been thinking about going back to school for my MBA. I haven\'t brought it up because it would mean less time and money for "us" stuff.' },
        { id: 'understand_me', answer: 'I wish she understood that my practicality isn\'t pessimism. I want our dreams to actually happen, which means planning for them.' },
      ],
    },
  },
};
