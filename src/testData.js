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
        { id: 'tangible_action', answer: 'I need him to stop punishing me with silence. When he shuts down for days, I feel like I\'m already gone in his mind. The cold shoulder makes me feel like there\'s no point in trying because he\'s already checked out.\n\nEven if he\'s angry, I\'d rather him yell at me than disappear. At least then I\'d know he still cares enough to fight. The silence feels like death—like our marriage is already over and we\'re just going through the motions.' },
        { id: 'biggest_wall', answer: 'His anger scares me. I know I deserve some of it, but when he yells, I shut down completely. We can\'t talk when he\'s like that. My body goes into freeze mode and I literally cannot form words.\n\nI grew up in a house with a lot of yelling and I think that\'s why I react this way. I\'m not asking him to not be angry—I know he has every right. I just need us to find a way to have these conversations where I don\'t feel physically unsafe.' },
        { id: 'unspoken', answer: 'The affair happened because I felt invisible for years. I\'m not excusing it, but I need him to understand I was drowning before it happened. I had told him so many times that I was lonely, that I needed more from him, and nothing changed.\n\nI know this sounds like I\'m blaming him, and I\'m not—what I did was my choice and my failure. But if we\'re going to rebuild, we have to look at what our marriage was before, not just what I did to it. Otherwise we\'ll just end up back in the same place.' },
        { id: 'vulnerability', answer: 'I need to know he actually wants to be here, not just staying for the kids or out of pride. I need to feel chosen, not tolerated. Right now it feels like he\'s only here because leaving would be too complicated.\n\nI can handle his anger, his questions, his need for transparency. What I can\'t handle is the feeling that I\'m fighting for something he\'s already given up on. I need some sign—however small—that he sees a future where he actually wants me, not just a future where he endures me.' },
        { id: 'understand_me', answer: 'I wish he understood that my guilt is crushing me. I don\'t need him to remind me what I did—I live with it every second of every day. Every time I look at our kids, every time I see our wedding photo, every time he flinches when I touch him.\n\nI\'m not asking him to feel sorry for me. I just wish he could see that his pain isn\'t the only pain in the room. I destroyed something precious and I have to live with that forever. His constant reminders don\'t make me more sorry—they make me want to give up because it feels like nothing will ever be enough.' },
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
        { id: 'tangible_action', answer: 'I need complete access to her phone and accounts. Not forever—but right now I need to verify. I can\'t just take her word for things anymore. Every time she\'s texting and smiles, I wonder if it\'s him. Every time she\'s late, I wonder if she\'s lying.\n\nI know this isn\'t sustainable and I don\'t want to be a prison warden. But I need this crutch right now while I rebuild my ability to trust. If she has nothing to hide, this should be easy. Her resistance makes me more suspicious, not less.' },
        { id: 'biggest_wall', answer: 'The images in my head. I can\'t stop picturing them together. It hits me randomly—driving, at work, trying to sleep. I don\'t know how to make it stop. Some days I\'ll be fine for hours, almost forget, and then something triggers it and I\'m right back in the worst moment of my life.\n\nI\'ve never felt pain like this. It\'s physical—like someone is sitting on my chest. I don\'t know how to explain to her that it\'s not about the sex, it\'s about the intimacy. She shared parts of herself with someone else that were supposed to be only mine.' },
        { id: 'unspoken', answer: 'Part of me wants her to hurt as much as I do. I know that\'s not healthy, but I\'m so angry. She got to feel desired while I got humiliated. She got excitement and passion while I was home being faithful and boring.\n\nSometimes I think about having my own affair just so she knows what this feels like. I won\'t do it—that\'s not who I am—but the fantasy of her feeling this pain gives me a dark satisfaction. I\'m ashamed of these thoughts but I can\'t make them stop.' },
        { id: 'vulnerability', answer: 'I need her to stop defending herself and just sit in my pain with me. Every time she explains "why," it feels like she\'s minimizing what she did. I don\'t care why. There is no why that makes this okay.\n\nWhat I need is for her to look me in the eyes and say "I destroyed you and there\'s no excuse." I need her to stop trying to make me understand and just let me be broken for a while. Her explanations feel like she\'s trying to talk me out of my pain, and that makes me feel even more alone.' },
        { id: 'understand_me', answer: 'I wish she understood that my anger is the only thing holding me together right now. If I stop being angry, I\'ll fall apart completely. The rage gives me energy, gives me something to do with all this pain. Without it, I\'m just devastated.\n\nShe keeps asking me to calm down, to talk rationally, to stop bringing it up. But she doesn\'t understand that underneath the anger is a sadness so deep I\'m afraid I\'ll drown in it. The anger is my life raft. When I\'m ready to let go of it, I will—but she can\'t rush me.' },
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
        { id: 'tangible_action', answer: 'I need him to check in with me during the day without me having to ask. Even a simple text saying he\'s thinking of me would help me feel like I matter. Right now, I feel like I\'m constantly chasing him for reassurance and it\'s exhausting.\n\nWhen he reaches out first, unprompted, it tells me I\'m on his mind. When I always have to ask, it feels like I\'m begging for scraps of attention from someone who should be fighting to keep me. I need to feel pursued, not like a burden.' },
        { id: 'biggest_wall', answer: 'The lies. It\'s not even the affair itself anymore—it\'s that he looked me in the eyes and lied for months. I don\'t know how to trust anything he says now. Every "I love you," every "I\'m working late," every reassurance—I hear it and wonder if this is another lie.\n\nI replay conversations in my head from that time and realize how many of them were performances. He was so convincing. That scares me more than the affair itself. How do I know when he\'s telling the truth if he could lie so easily before?' },
        { id: 'unspoken', answer: 'Sometimes I wonder if I\'m only staying because I\'m scared of being alone and starting over at 42. I haven\'t told him that. What if my commitment to this marriage is really just fear of the alternative?\n\nI look at single friends my age and the dating world terrifies me. I think about splitting holidays with the kids, selling the house, explaining this to my parents. Maybe I\'m not staying because I believe in us—maybe I\'m just too scared to leave. That thought haunts me.' },
        { id: 'vulnerability', answer: 'I need to see consistent effort over time, not just bursts of attention when he senses I\'m pulling away. I need to know this matters to him even on ordinary days. It\'s easy to be attentive during a crisis, but what about in six months when this feels less urgent?\n\nI\'ve seen him do this before—big gestures when things are bad, then slowly sliding back into neglect. I need to know this time is different. I need to see change that sticks, not just crisis management. That\'s the only way I\'ll believe this is real.' },
        { id: 'understand_me', answer: 'I wish he understood that my anger isn\'t me trying to punish him—it\'s me still processing. When I bring it up, I\'m not attacking. I\'m trying to heal. Every time I mention it, he sighs or gets defensive, like I should be over it by now.\n\nBut I can\'t heal on his timeline. This isn\'t something I can just decide to get over. When I talk about it, I\'m trying to work through it, not torture him. His impatience makes me feel like my pain is an inconvenience to him, and that makes everything worse.' },
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
        { id: 'tangible_action', answer: 'I wish she would let me hold her sometimes without pulling away. Physical touch used to be how we connected and I miss that closeness. I understand why she flinches—I broke her trust—but the physical distance is killing me.\n\nI\'m not asking for intimacy or even affection. I just want to be able to sit next to her without feeling like a stranger. When she pulls away, I feel like a monster. I know I caused this, but I don\'t know how to show her I\'m safe again if she won\'t let me near her.' },
        { id: 'biggest_wall', answer: 'She says she wants to move forward but then won\'t let me forget the past. I feel like I\'m being punished forever and nothing I do will ever be enough. I understand she needs to process, but sometimes it feels like she\'s keeping score.\n\nI can\'t undo what I did. I can only show up differently now. But when every conversation circles back to my failure, I lose hope. I need to know there\'s a finish line somewhere—not that she has to forgive me now, but that forgiveness is at least possible someday.' },
        { id: 'unspoken', answer: 'I\'m terrified that I broke something that can\'t be fixed. And I\'m scared that if she knew how much shame I carry, she\'d see me as weak. I can barely look at myself in the mirror. I hate who I became.\n\nEvery day I wake up and remember what I did, and I feel sick. But I can\'t show that to her because she needs me to be strong, to be present, to absorb her pain. If she saw how broken I am too, I think she\'d lose all respect for me. So I carry it alone.' },
        { id: 'vulnerability', answer: 'I need her to give me some sign that progress is possible. Even small acknowledgments that I\'m trying would help me keep going. Right now it feels like nothing I do registers. I\'ve changed so much but she can\'t see it.\n\nI\'m not asking for praise for doing what I should have been doing all along. But a simple "I noticed you did that" would mean the world. Without any positive feedback, I feel like I\'m shouting into a void. It makes me want to give up, even though I won\'t.' },
        { id: 'understand_me', answer: 'I wish she understood that my defensiveness comes from shame, not dismissal. When I get quiet or pull back, it\'s because I hate myself, not because I don\'t care. Every accusation confirms what I already believe—that I\'m worthless.\n\nWhen she attacks, my instinct is to protect myself because I\'m already drowning in self-hatred. I know I should just absorb it, but sometimes I can\'t take any more. I wish she could see that my walls aren\'t about avoiding accountability—they\'re about surviving my own self-destruction.' },
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
        { id: 'avoid_topic', answer: 'His relationship with his mother. Every time I bring up boundaries, he accuses me of trying to isolate him from his family. But she calls five times a day and expects him to drop everything. I feel like I\'m competing with her for my own husband.\n\nI\'ve tried bringing it up gently, I\'ve tried being direct, I\'ve tried writing him letters. Nothing works. He immediately gets defensive and turns it around on me, saying I\'m jealous or controlling. So now I just don\'t say anything and seethe quietly, which I know isn\'t healthy either.' },
        { id: 'wish_understood', answer: 'When I get quiet, I\'m not giving him the silent treatment—I\'m trying not to say something I\'ll regret. I need time to process before I can talk. My brain doesn\'t work like his. I can\'t argue and think at the same time.\n\nHe pushes for immediate resolution, but that pressure makes me shut down more. I need him to give me space to collect my thoughts and come back to the conversation when I\'m ready. That\'s not avoidance—it\'s how I regulate myself so I can actually be productive.' },
        { id: 'own_pattern', answer: 'I know I interrupt him. I get so anxious that he won\'t hear my point that I jump in before he finishes. It makes him feel dismissed. I can see his face change when I do it—he shuts down because why bother talking if I\'m not going to let him finish?\n\nIt comes from growing up in a loud family where you had to fight to be heard. But I know that\'s an explanation, not an excuse. I\'m genuinely trying to catch myself, but in heated moments, the old pattern takes over before I can stop it.' },
        { id: 'recent_conversation', answer: 'Last week we argued about vacation plans. It started small but ended with him saying I never consider his feelings. I wish I had paused instead of defending myself. Instead, I listed all the times I had considered his feelings, which made him feel like I wasn\'t hearing him at all.\n\nLooking back, what he needed was for me to say "I hear you—it sounds like you\'ve been feeling overlooked." Instead, I made it about proving him wrong. Even though I think I do consider his feelings, that wasn\'t the moment to argue that point. I should have just listened.' },
        { id: 'understand_me', answer: 'I wish he understood that I\'m not trying to win arguments—I\'m trying to feel heard. When he gets defensive, I feel like my concerns don\'t matter. So I push harder, which makes him more defensive, and we end up in this awful spiral.\n\nAll I want is for him to say "that makes sense" or "I can see why you feel that way" before jumping into his perspective. I don\'t even need him to agree with me. I just need acknowledgment that my experience is valid. Without that, I feel invisible.' },
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
        { id: 'avoid_topic', answer: 'How much time she spends on her phone when we\'re together. I feel like I\'m competing with her social media for attention. We\'ll be watching a movie and she\'s scrolling. We\'ll be at dinner and she\'s checking notifications. I feel like I\'m not interesting enough.\n\nI\'ve mentioned it once or twice and she got defensive, said I was being controlling, that she\'s allowed to have her own interests. So now I just sit there feeling ignored while she likes other people\'s posts. It sounds petty but it really hurts.' },
        { id: 'wish_understood', answer: 'I need to think before I respond. When she rapid-fires questions at me, I shut down. It\'s not stonewalling—I genuinely need processing time. My brain doesn\'t generate answers on demand. I need to turn things over internally before I know what I think.\n\nShe interprets my silence as evasion or indifference, but it\'s actually the opposite. I\'m being quiet because I\'m taking her seriously, trying to give a thoughtful response. When she demands immediate answers, she gets my worst, most defensive reactions instead of what I actually mean.' },
        { id: 'own_pattern', answer: 'I raise my voice when I feel unheard. I know it scares her and shuts down the conversation, but in the moment I can\'t seem to stop. It\'s like the volume is the only way to get through, even though I know intellectually it does the opposite.\n\nI come from a family of yellers—that was normal for us. But I see how she shrinks when I get loud and I hate myself for it. I\'m trying to catch it earlier, to take a breath before I escalate, but it\'s hard to undo decades of conditioning.' },
        { id: 'recent_conversation', answer: 'She asked about my day and I gave a short answer. She got upset that I don\'t share. I wish I\'d realized she was reaching out, not interrogating me. In the moment, I felt put on the spot and I defaulted to brief, which she read as dismissive.\n\nThe truth is my day was fine—nothing notable happened. But I could have said that differently. I could have asked about her day first, or shared something small. Instead, I made her feel like she was annoying me by asking, which wasn\'t true at all.' },
        { id: 'understand_me', answer: 'I wish she understood that when I say "I don\'t know," I really don\'t know. I\'m not being evasive—I\'m still figuring out how I feel. She asks me complex emotional questions and expects immediate clarity, but emotions aren\'t like that for me.\n\nI need to sit with things, sometimes for hours or days, before I understand what I\'m feeling. When she pushes for immediate answers, I either shut down or say something half-formed that I don\'t actually mean, which creates more problems. My "I don\'t know" is honest—I wish she could trust that.' },
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
        { id: 'when_close', answer: 'Before we had kids. We used to stay up late talking about everything and nothing. Now we\'re just managing logistics. "Did you pay the electric bill?" "Who\'s picking up Emma?" "Did you call the plumber?" That\'s 90% of our conversations now.\n\nI remember when we used to be curious about each other. We\'d ask real questions, share random thoughts, laugh at inside jokes. Now we\'re like business partners running a household. Efficient, maybe, but so lonely. I miss my friend.' },
        { id: 'missing', answer: 'Being his person. He used to tell me things first—good news, bad days, random thoughts. Now I hear about his life secondhand or not at all. Last week I found out from his sister that he got a promotion. His sister knew before me.\n\nIt\'s not that he\'s secretive, it\'s that I\'ve just become... furniture. I\'m part of the background of his life, not someone he thinks to share things with. That realization hit me like a truck. When did I stop being the first person he wanted to tell?' },
        { id: 'reconnect', answer: 'I\'d love for him to plan something for us. Not expensive—just something that shows he thought about what I might enjoy. A picnic in the park, tickets to that band I mentioned once, even just making dinner and setting the table nicely. Something with intention.\n\nI\'m always the one who plans things. Date nights, weekend activities, vacations—if I don\'t organize it, it doesn\'t happen. Just once, I want to be surprised. I want to know he was thinking about me and what would make me happy, without me having to ask.' },
        { id: 'barrier_to_reaching', answer: 'Fear of rejection. The last few times I\'ve tried to initiate connection, he was distracted or tired. I\'ve stopped trying to avoid feeling unwanted. There\'s only so many times you can reach for someone and get nothing back before you stop reaching.\n\nI used to sit next to him on the couch. Now I sit in the chair across the room. I used to touch his arm when we talked. Now I keep my hands to myself. Each small rejection trained me to expect nothing, and now I don\'t even try. It\'s safer to be distant than to be rejected.' },
        { id: 'understand_me', answer: 'I wish he understood that when I ask "how was your day," I\'m not making small talk. I\'m trying to find a way back in. Every question is an invitation to connect. Every "fine" feels like a door closing in my face.\n\nI know I should probably tell him this directly instead of hoping he\'ll figure it out. But it\'s hard to say "I\'m desperate to connect with you" without sounding pathetic. So I keep asking my little questions, hoping one day he\'ll answer differently, hoping he\'ll see what I\'m really asking: "Do you still want me?"' },
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
        { id: 'when_close', answer: 'Our first apartment. We had nothing but each other. Now we have everything we thought we wanted and somehow feel further apart. Back then, a pizza and a movie rental was a perfect Saturday. We\'d talk for hours about our dreams, our fears, stupid hypotheticals.\n\nNow we have the house, the cars, the kids, the stuff—and none of it makes us happy. We got everything we were working toward and lost each other in the process. Sometimes I wonder if we were closer when we were struggling because the struggle was something we did together.' },
        { id: 'missing', answer: 'Her looking at me the way she used to. Like I was interesting. Like she chose me on purpose, not just by default. Now she looks through me, or past me, or not at all. I could walk into a room and she might not even notice.\n\nI used to feel like the most important person in her world. Now I feel like an appliance—useful for certain functions, but not someone she\'s actually excited to see. I miss being lit up for. I miss seeing her face change when I walked in the door.' },
        { id: 'reconnect', answer: 'If she came to bed at the same time as me instead of staying up alone. Those late night conversations we used to have—I miss them. Now I go to bed and she stays up watching TV or scrolling her phone. By the time she comes to bed, I\'m asleep.\n\nThat was always our time. The house quiet, the day done, just the two of us talking in the dark. I\'ve asked her to come to bed earlier and she says she will, but she doesn\'t. Maybe she needs that alone time. But to me, it feels like she\'d rather be alone than be with me.' },
        { id: 'barrier_to_reaching', answer: 'I honestly don\'t know what she wants anymore. When I try, it feels like it\'s never the right thing. So I\'ve stopped guessing. If I plan a date, it\'s the wrong restaurant. If I buy flowers, she\'s annoyed I wasted money. If I try to talk, she\'s busy.\n\nI know I should keep trying, but it\'s hard when everything feels wrong. I\'ve started to wonder if it\'s me she doesn\'t want, not the specific attempts. Maybe I\'m just not what she wants anymore, and no amount of effort will change that.' },
        { id: 'understand_me', answer: 'I wish she understood that I feel the distance too. I\'m not content with how things are. I just don\'t know how to fix it. She seems to think I don\'t notice or don\'t care, but I do. I lie awake some nights wondering where we went wrong.\n\nI\'m scared to bring it up because what if she says something I can\'t unhear? What if she tells me she\'s not sure she loves me anymore? As long as we don\'t talk about it, I can pretend we\'re okay. I know that\'s not healthy, but the alternative terrifies me.' },
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
        { id: 'biggest_stressor', answer: 'His job uncertainty. He might get laid off and we have a mortgage and two kids. I\'m terrified but I can\'t show it because he\'s already spiraling. So I carry my fear silently while trying to be supportive of his fear.\n\nI\'ve run the numbers a hundred times. How long could we survive on just my salary? Would we have to sell the house? Pull the kids from their school? I lie awake doing mental math while he sleeps next to me, oblivious to how scared I am.' },
        { id: 'need_from_partner', answer: 'I need him to handle things without me having to ask or manage. I\'m exhausted from being the one who remembers everything. Every doctor\'s appointment, every school form, every birthday gift for every relative—it all lives in my head and it\'s crushing me.\n\nI don\'t want to be his manager. I want a partner who sees what needs to be done and does it. When I have to ask him to take out the trash that\'s been overflowing for three days, I\'ve already expended the mental energy. The asking is the hardest part.' },
        { id: 'own_contribution', answer: 'I know I catastrophize. When I\'m stressed, I list every worst-case scenario out loud, which makes his anxiety worse. I can see him visibly tense up when I start spiraling, but I can\'t seem to stop. It\'s like I need to voice every fear to feel less alone with them.\n\nI also know I get controlling when I\'m anxious. I micromanage him, the kids, the household. It comes from a place of fear—if I can control everything, nothing bad can happen. But I know it\'s suffocating and I know it sends the message that I don\'t trust him.' },
        { id: 'support_wish', answer: 'I wish he knew that when I\'m overwhelmed, I don\'t need solutions—I need him to say "that sounds really hard" and maybe just hold me. He jumps into fix-it mode the second I share a problem. But sometimes there\'s nothing to fix. Sometimes I just need to not be alone.\n\nHis suggestions, even when they\'re good, make me feel like he\'s not really listening. Like he\'s just trying to make my feelings go away as quickly as possible. I need him to sit with me in the hard stuff before we try to solve it.' },
        { id: 'understand_me', answer: 'I wish he understood that my need to control things comes from fear, not from thinking he\'s incompetent. When I take over or micromanage, it\'s not because I don\'t trust him—it\'s because I\'m terrified and controlling feels like the only way to be safe.\n\nI know it hurts him when I redo things he\'s done or double-check everything. I know it feels like I\'m saying he can\'t handle it. But it\'s not about him at all—it\'s about my own anxiety looking for something to grip onto. I\'m working on it, but it\'s really hard.' },
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
        { id: 'biggest_stressor', answer: 'Work. I might lose my job and I feel like a failure. I\'m supposed to provide for my family and I can\'t even guarantee that. Every morning I drive to an office where I might not be wanted anymore, and every evening I come home and pretend everything\'s fine.\n\nMy dad worked the same job for 35 years. He never had to worry about layoffs or "restructuring." I feel like I\'m failing at something he made look easy. I know times are different, but that knowledge doesn\'t stop the shame.' },
        { id: 'need_from_partner', answer: 'Space to figure things out without feeling like she\'s watching and judging. Her worry feels like pressure, even when she means well. Every time she asks "any news today?" I hear "why haven\'t you fixed this yet?"\n\nI know she\'s just anxious and wants information. But I don\'t have any information to give. I\'m doing everything I can—networking, applying, interviewing. I need her to trust that I\'m handling it, even when I can\'t give her constant updates. Her hovering makes me feel like more of a failure.' },
        { id: 'own_contribution', answer: 'I withdraw when stressed. I know she needs connection but I don\'t have anything left to give. So I hide in the garage or stay late at work. It\'s easier to be alone with my stress than to carry hers too.\n\nI see her reaching for me and I pull away, and I hate myself for it. But when I\'m running on empty, other people\'s needs feel like demands I can\'t meet. I know isolation isn\'t the answer. But connection takes energy I don\'t have right now.' },
        { id: 'support_wish', answer: 'I wish she knew that when I say "I\'m fine," I\'m not shutting her out—I\'m trying not to burden her with problems I should be able to handle. I was raised to believe men don\'t complain, men fix things, men don\'t fall apart.\n\nSome days I want to break down and tell her how scared I am. But I\'m afraid that if I fall apart, she\'ll lose faith in me. She needs me to be strong. Or at least, I think she does. Maybe that\'s a story I\'m telling myself. Either way, the wall stays up.' },
        { id: 'understand_me', answer: 'I wish she understood that my silence isn\'t indifference. I\'m scared too. I just don\'t know how to say it without making things worse. In my head, my fear is a burden I should carry alone. Sharing it would just make her more anxious.\n\nBut keeping it inside is killing me. I feel more alone than ever, even though she\'s right there. I want to let her in, but I don\'t know how to be vulnerable without feeling weak. I was never taught that was allowed.' },
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
        { id: 'barrier', answer: 'I\'m exhausted. By the time the kids are in bed and the house is quiet, I have nothing left. And honestly, I don\'t feel desirable anymore. I haven\'t felt like a sexual being in years—I feel like a mom, a maid, a manager. Not a woman someone wants.\n\nMy body doesn\'t feel like mine. It\'s been stretched and used and touched all day by little hands needing things. By the time I get to bed, I just want to be alone in my own skin for a few minutes. Sex feels like one more person needing something from my body.' },
        { id: 'desire_for', answer: 'More buildup. I need to feel wanted throughout the day, not just at 10pm. A flirty text, a genuine compliment, something that makes me feel seen. Sex doesn\'t start in the bedroom for me—it starts hours earlier with feeling connected and desired.\n\nWhen he just initiates at night with no lead-up, it feels transactional. Like he\'s taking care of a need rather than connecting with me. I want to feel like he wants me, specifically—not just release. I need the emotional foreplay as much as the physical kind.' },
        { id: 'unsaid', answer: 'Sometimes I fake it just to get it over with. I hate admitting that, but it\'s true. I don\'t know how to tell him what I actually need. It\'s been so long since I felt genuine pleasure that I\'m not even sure what would work anymore.\n\nI feel broken. Other women seem to enjoy sex, but I just endure it. I love him and want to be close to him, but my body doesn\'t cooperate. I don\'t know if it\'s hormones, stress, or something deeper, but I\'m too ashamed to talk about it.' },
        { id: 'change_over_time', answer: 'It used to feel exciting and spontaneous. Now it feels like another chore on my to-do list. I miss wanting it. I miss feeling that pull toward him. I remember when his touch would light me up, and now it just makes me tense.\n\nI don\'t know where that desire went. I loved our physical connection. Now I feel like I\'m going through the motions of being a wife. I worry he can tell. I worry we\'re going to be one of those couples who just... stops.' },
        { id: 'understand_me', answer: 'I wish he understood that my lack of desire isn\'t about him. I\'m touched out, stressed, and disconnected from my own body. It\'s not that I don\'t find him attractive—I just don\'t find anything attractive right now, including myself.\n\nI can see his hurt when I turn him down, and it breaks my heart. But I can\'t force something that isn\'t there. I wish he could see that this is about my relationship with my own body, not about him. If I could flip a switch and want it, I would.' },
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
        { id: 'barrier', answer: 'The constant rejection. I\'ve stopped initiating because it hurts too much to be turned down. I feel unwanted and it\'s killing my confidence. Every "not tonight" chips away at me until there\'s nothing left.\n\nI used to be confident. Now I question whether she\'s attracted to me at all. I\'ve gained weight, I\'m older—maybe I\'m just not what she wants anymore. The rejection has made me so insecure that even when she does seem interested, I assume she\'s just doing it out of obligation.' },
        { id: 'desire_for', answer: 'For her to initiate sometimes. To feel like she actually wants me, not just tolerates me. I want to feel desired too. It\'s been years since she reached for me first. Years since I felt like she wanted me, not just went along with me.\n\nEveryone talks about women needing to feel desired, but men need that too. I need to know she looks at me and feels something. Right now I feel like a burden—like my desire is a problem she has to deal with.' },
        { id: 'unsaid', answer: 'I miss her so much it hurts. But I\'ve stopped saying it because I don\'t want to pressure her. So I just... wait. I wait for her to want me, and the waiting is agony. I fill my nights with TV and distractions so I don\'t think about it.\n\nSometimes I lie in bed watching her sleep and I feel so lonely. She\'s right there but completely unreachable. I don\'t know how to bridge this gap without making her feel guilty, so I say nothing and die a little inside.' },
        { id: 'change_over_time', answer: 'We used to not be able to keep our hands off each other. Now we go weeks without touching. I don\'t know when we became roommates. I remember when she\'d look at me a certain way and I\'d know. Now she barely looks at me at all.\n\nI scroll through old photos sometimes—vacations, early years—and we look so happy, so connected. What happened to those people? Are they still in there somewhere, or are they gone for good?' },
        { id: 'understand_me', answer: 'I wish she understood that physical intimacy is how I feel loved and connected. Without it, I feel like we\'re just coparenting, not partners. It\'s not about the sex itself—it\'s about what the sex represents: that she wants me, that we\'re still connected.\n\nI know she shows love in other ways—making coffee, handling things for the family. I see those things and I appreciate them. But they don\'t make me feel loved the way physical connection does. We\'re speaking different languages and neither of us is fluent in the other\'s.' },
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
        { id: 'concern', answer: 'We\'ve never really been tested. Everything has been relatively easy so far. I worry we don\'t know how we\'ll handle real adversity. What happens when someone loses a parent, or gets seriously ill, or we face a financial crisis? We\'ve built something beautiful in calm waters.\n\nSometimes I catch myself almost wanting something to go wrong just so we can prove we can handle it. That\'s crazy, I know. But this easy season makes me nervous. What if we\'re only good together when things are good?' },
        { id: 'conversation_needed', answer: 'Kids—when, how many, and what happens if one of us changes our mind. We\'ve danced around it but never really gone deep. He says he wants kids "eventually," but what does that mean? I\'m 31. Eventually is approaching fast.\n\nI\'m scared to push the conversation because what if we want fundamentally different things? It\'s easier to assume we\'re aligned than to find out we\'re not. But that\'s not fair to either of us. We need to have the real conversation before we make permanent decisions.' },
        { id: 'strength', answer: 'We genuinely like each other. Even after three years, I still want to tell him about my day and hear about his. So many couples seem to lose that—they become roommates who tolerate each other. We\'re still friends.\n\nHe makes me laugh every single day. We have inside jokes, shared references, a whole language that\'s just ours. When I imagine growing old with someone, the most important thing isn\'t passion—it\'s having someone I\'d actually want to hang out with. He\'s that person.' },
        { id: 'dream_unsupported', answer: 'I want to take a year off to travel before we have kids. I don\'t think he takes it seriously—he sees it as impractical. But this is something I\'ve dreamed about since I was 20, and the window is closing. Once we have kids, we can\'t just take off.\n\nWhen I bring it up, he changes the subject or says "we\'ll see." That tells me he doesn\'t want to say no outright, but he\'s not going to help make it happen either. I don\'t know if I can let this dream go without resenting him for it.' },
        { id: 'understand_me', answer: 'I wish he understood that my need for adventure isn\'t restlessness—it\'s how I feel alive. I need him to dream with me, not just plan. Sometimes I want to talk about possibilities without immediately hearing why they won\'t work.\n\nI know he\'s practical because he cares, because he wants to protect our future. But I need room to dream out loud without it being shut down. Even if we never do half of what I imagine, the dreaming together matters. It makes me feel like we\'re building something exciting, not just safe.' },
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
        { id: 'concern', answer: 'I sometimes wonder if we\'re together because it\'s comfortable or because we\'re truly right for each other. How do you know the difference? We make sense on paper—same values, similar backgrounds, easy compatibility. But is "making sense" the same as being right?\n\nI love her, I\'m sure of that. But I\'ve never had the crazy, consuming passion some people describe. Is that just in movies, or am I missing something? Sometimes I worry I settled without realizing it. That\'s a terrible thing to think about the person you\'re planning to marry.' },
        { id: 'conversation_needed', answer: 'What happens if our careers pull us in different directions. We\'re both ambitious—I don\'t know how we\'d handle competing priorities. Right now we\'re in the same city, same trajectory. But what if one of us gets an opportunity somewhere else?\n\nI\'ve avoided asking directly: "Would you move for me? Would you expect me to move for you?" I\'m afraid of the answer. Either way, someone might have to sacrifice, and I don\'t know if we\'ve built enough to survive that kind of test.' },
        { id: 'strength', answer: 'We communicate well. When something bothers one of us, we actually talk about it instead of letting it fester. I\'ve seen so many couples who can\'t have a hard conversation—they avoid, they hint, they blow up. We just... talk.\n\nThat might sound basic, but I\'ve come to realize it\'s rare. We can disagree without it becoming a fight. We can admit when we\'re wrong. We can say "I need something different" without the other person getting defensive. That foundation feels solid.' },
        { id: 'dream_unsupported', answer: 'I\'ve been thinking about going back to school for my MBA. I haven\'t brought it up because it would mean less time and money for "us" stuff. Two years of night classes, weekends studying, depleted savings. It\'s a lot to ask.\n\nI\'m afraid she\'ll feel like I\'m choosing my career over our life together. Or that she\'ll say yes but resent me for it. So I keep putting off the conversation, which just means I\'m deciding by not deciding. That\'s not fair to either of us.' },
        { id: 'understand_me', answer: 'I wish she understood that my practicality isn\'t pessimism. I want our dreams to actually happen, which means planning for them. When she says "let\'s travel for a year," I immediately think about health insurance, job gaps, savings.\n\nIt\'s not that I don\'t want adventure—I do. I just need to know we\'re not being reckless. She hears my questions as resistance, but really they\'re me trying to figure out how to make it work. I wish she could see my planning as a form of love, not a form of limitation.' },
      ],
    },
  },
};
