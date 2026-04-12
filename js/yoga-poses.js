const POSES = [
    {
        id: 'tadasana', name: 'Mountain Pose (Tadasana)', flow: ['urdhva-hastasana', 'uttanasana-a', 'utkatasana', 'vrksasana'],
        desc: 'Stand tall with your feet together, shoulders relaxed, weight distributed evenly through your soles, arms at sides.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 0,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': 0, '--le-rot': 0,
            '--ra-rot': 0, '--re-rot': 0,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'urdhva-hastasana', name: 'Upward Salute (Urdhva Hastasana)', flow: ['uttanasana-a'],
        desc: 'Inhale and sweep your arms up toward the ceiling. Keep your palms facing each other or touching, gazing slightly up.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 0,
            '--ub-rot': 0, '--head-rot': -20,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': 180, '--re-rot': 0,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'uttanasana-a', name: 'Standing Forward Fold (Uttanasana A)', flow: ['ardha-uttanasana', 'padangusthasana'],
        desc: 'Exhale and fold forward from your hip joints. Let your head hang and bring your hands down towards the floor.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': -30,
            '--ub-rot': 180, '--head-rot': 0,
            '--la-rot': -125, '--le-rot': -110,
            '--ra-rot': -125, '--re-rot': -110,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'ardha-uttanasana', name: 'Half Forward Fold (Ardha Uttanasana)', flow: ['chaturanga-dandasana', 'uttanasana-a'],
        desc: 'Inhale, lift your torso halfway up to parallel with the floor. Keep your spine long and fingertips dangling or on your shins.',
        vars: {
            '--fig-rot': 0, '--fig-x': -50, '--fig-y': 0,
            '--ub-rot': 90, '--head-rot': -30,
            '--la-rot': -90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'padangusthasana', name: 'Big Toe Pose (Padangusthasana)', flow: ['padahastasana', 'ardha-uttanasana'],
        desc: 'Fold forward, grab your big toes with your index and middle fingers, and pull your torso down.',
        inherit: 'uttanasana-a',
        vars: {
            '--la-rot': -125, '--le-rot': -95,
            '--ra-rot': -125, '--re-rot': -95
        }
    },
    {
        id: 'padahastasana', name: 'Gorilla Pose (Padahastasana)', flow: ['ardha-uttanasana'],
        desc: 'Fold forward, slide your hands completely under your feet, palms facing up.',
        inherit: 'padangusthasana',
        vars: {
            '--la-rot': -130, '--le-rot': -100,
            '--ra-rot': -130, '--re-rot': -100
        }
    },
    {
        id: 'chaturanga-dandasana', name: 'Low Plank (Chaturanga Dandasana)', flow: ['urdhva-mukha-svanasana'],
        desc: 'Exhale and lower into a push-up hover. Keep your body in a straight line and elbows hugged into your ribs.',
        vars: {
            '--fig-rot': 0, '--fig-x': -50, '--fig-y': 131,
            '--ub-rot': 77, '--head-rot': 0,
            '--la-rot': -167, '--le-rot': 90,
            '--ra-rot': -167, '--re-rot': 90,
            '--ll-rot': 77, '--lk-rot': 0,
            '--rl-rot': 77, '--rk-rot': 0,
            '--torso-cx': 110
        }
    },
    {
        id: 'urdhva-mukha-svanasana', name: 'Upward-Facing Dog (Urdhva Mukha Svanasana)', flow: ['adho-mukha-svanasana'],
        desc: 'Inhale, press into your hands, straighten your arms, lift your chest, and hover your thighs just above the floor.',
        vars: {
            '--fig-rot': 0, '--fig-x': -50, '--fig-y': 140,
            '--ub-rot': 23, '--head-rot': -20,
            '--la-rot': -23, '--le-rot': 0,
            '--ra-rot': -23, '--re-rot': 0,
            '--ll-rot': 80, '--lk-rot': 0,
            '--rl-rot': 80, '--rk-rot': 0,
            '--torso-cx': 160
        }
    },
    {
        id: 'vrksasana', name: 'Tree Pose (Vrksasana)',
        desc: 'Balance on your left leg. Place your right foot on your left inner thigh. Raise arms above head, hands together.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 0,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': -135, '--le-rot': -90,
            '--ra-rot': 135, '--re-rot': 90,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 60, '--rk-rot': -120
        }
    },
    {
        id: 'adho-mukha-svanasana', name: 'Downward-Facing Dog (Adho Mukha Svanasana)', flow: ['virabhadrasana-i', 'virabhadrasana-i-left', 'trikonasana', 'trikonasana-left', 'ardha-uttanasana', 'ardha-pincha-mayurasana', 'eka-pada-rajakapotasana', 'marjaryasana', 'eka-pada-adho-mukha-svanasana'],
        desc: 'Form an inverted V shape with your body. Press hands into the floor, hips lifted high, legs straight.',
        details: {
            head: 'Relax your neck. Let the crown of your head point towards the floor. Drishti (gaze) is towards your navel.',
            hands: 'Spread fingers wide, index fingers parallel. Press firmly through all knuckles.',
            feet: 'Feet hip-width apart. Press heels gently toward the mat.'
        },
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 38.6,
            '--ub-rot': 126, '--head-rot': 0,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': 180, '--re-rot': 0,
            '--ll-rot': 36, '--lk-rot': 0,
            '--rl-rot': 36, '--rk-rot': 0,
            '--torso-cx': 120
        }
    },
    {
        id: 'eka-pada-adho-mukha-svanasana', name: 'Three-Legged Dog (Eka Pada Adho Mukha Svanasana)', flow: ['adho-mukha-svanasana', 'phalakasana', 'eka-pada-rajakapotasana', 'virabhadrasana-i'],
        desc: 'From Downward Dog, lift one leg straight up and back, keeping hips square to the mat.',
        inherit: 'adho-mukha-svanasana',
        vars: {
            '--rl-rot': 180, '--rk-rot': 0
        }
    },
    {
        id: 'utkatasana', name: 'Chair Pose (Utkatasana)', flow: ['uttanasana-a', 'virabhadrasana-i'],
        desc: 'Bend your knees and lower your hips as if sitting in a chair. Reach your arms up alongside your ears.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 32,
            '--ub-rot': 45, '--head-rot': -20,
            '--la-rot': 135, '--le-rot': 0,
            '--ra-rot': 135, '--re-rot': 0,
            '--ll-rot': -45, '--lk-rot': 45,
            '--rl-rot': -45, '--rk-rot': 45,
            '--torso-cx': 130
        }
    },
    {
        id: 'virabhadrasana-i', name: 'Warrior I - Right (Virabhadrasana I)', flow: ['virabhadrasana-ii', 'utthita-parsvakonasana', 'parivrtta-parsvakonasana'],
        desc: 'Step left foot back, keep back leg straight, front knee bent 90 degrees. Reach arms up to the sky.',
        view: 'front',
        details: {
            head: 'Gaze forward past your nose, or gently tip the head back to look at your thumbs.',
            hands: 'Palms pressed together or facing each other, reaching straight up.',
            feet: 'Back foot turned out 45 degrees, pressing firmly into the outer edge. Front knee tracks over the ankle.'
        },
        varsFront: {
            '--fig-y': 88,
            '--ub-rot-f': 0, '--head-rot-f': -15,
            '--la-rot-f': 180, '--le-rot-f': 0,
            '--ra-rot-f': 180, '--re-rot-f': 0,
            '--ll-rot-f': 30, '--lk-rot-f': 0,
            '--rl-rot-f': -60, '--rk-rot-f': 60
        },
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 88,
            '--ub-rot': 0, '--head-rot': -15,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': 180, '--re-rot': 0,
            '--ll-rot': 60, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 90
        }
    },
    {
        id: 'virabhadrasana-i-left', name: 'Warrior I - Left (Virabhadrasana I)', flow: ['virabhadrasana-ii'],
        desc: 'Step right foot back, keep back leg straight, front left knee bent 90 degrees.',
        inherit: 'virabhadrasana-i',
        vars: {
            '--ll-rot': -90, '--lk-rot': 90,
            '--rl-rot': 60, '--rk-rot': 0
        }
    },
    {
        id: 'virabhadrasana-ii', name: 'Warrior II (Virabhadrasana II)', flow: ['utthita-parsvakonasana', 'trikonasana', 'parsvottanasana'],
        desc: 'Lunge right knee to 90 degrees, left leg straight back. Stretch arms horizontally, gaze over your front hand.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 88,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': 60, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 90
        }
    },
    {
        id: 'balasana', name: 'Child\'s Pose (Balasana)', flow: ['dandasana', 'savasana'],
        desc: 'Kneel on the floor, fold your torso over your thighs, and stretch your arms forward. Rest your forehead.',
        vars: {
            '--fig-rot': 0, '--fig-x': -100, '--fig-y': 168,
            '--ub-rot': -90, '--head-rot': 0,
            '--la-rot': 0, '--le-rot': 0,
            '--ra-rot': 0, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': 180,
            '--rl-rot': -90, '--rk-rot': 180,
            '--torso-cx': 40
        }
    },
    {
        id: 'dandasana', name: 'Staff Pose (Dandasana)', flow: ['paschimottanasana', 'purvottanasana', 'janu-sirsasana', 'marichyasana-a', 'navasana'],
        desc: 'Sit on the floor with legs extended straight in front. Keep torso perfectly upright and hands beside your hips.',
        vars: {
            '--fig-rot': 0, '--fig-x': -60, '--fig-y': 168,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': 0, '--le-rot': 0,
            '--ra-rot': 0, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 0
        }
    },
    {
        id: 'paschimottanasana', name: 'Seated Forward Bend (Paschimottanasana)', flow: ['ardha-baddha-padma-paschimottanasana', 'triang-mukha-eka-pada-paschimottanasana', 'purvottanasana'],
        desc: 'From Staff Pose, fold forward at the hips, reaching your hands toward your feet over straight legs.',
        vars: {
            '--fig-rot': 0, '--fig-x': -60, '--fig-y': 168,
            '--ub-rot': 90, '--head-rot': 30,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': 180, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 0,
            '--torso-cx': 50
        }
    },
    {
        id: 'ardha-baddha-padma-paschimottanasana', name: 'Half-Bound Lotus Forward Fold (Ardha Baddha Padma Paschimottanasana)', flow: ['paschimottanasana'],
        desc: 'One leg straight, the other folded into half lotus. Fold torso over the straight leg.',
        inherit: 'paschimottanasana',
        vars: {
            '--ll-rot': -120, '--lk-rot': 180, // Left leg completely folded in half (thigh up-right, shin down-left)
            '--rl-rot': -90, '--rk-rot': 0   // Right leg straight horizontal
        }
    },
    {
        id: 'triang-mukha-eka-pada-paschimottanasana', name: 'Three-Limbed Forward Fold (Triang Mukha Eka Pada Paschimottanasana)', flow: ['janu-sirsasana'],
        desc: 'Fold over a straight leg with the other leg folded back beside the hip.',
        inherit: 'paschimottanasana',
        vars: {
            '--rl-rot': 0, '--rk-rot': 150 // Right foot points straight back
        }
    },
    {
        id: 'janu-sirsasana', name: 'Head-to-Knee Pose (Janu Sirsasana)', flow: ['marichyasana-a'],
        desc: 'Fold over a straight leg, with the sole of the other foot pressing into the inner thigh.',
        inherit: 'paschimottanasana',
        vars: {
            '--rl-rot': 20, '--rk-rot': -120 // Knee drops outward
        }
    },
    {
        id: 'marichyasana-a', name: 'Marichyasana A (Marichyasana A)', flow: ['navasana'],
        desc: 'Seated with one leg straight, the other knee bent pointing up. Bind the bent knee and fold forward.',
        inherit: 'dandasana', // Start upright
        vars: {
            '--ub-rot': 40, '--head-rot': 10,  // Fold forward
            '--rl-rot': -30, '--rk-rot': 120,  // Right knee points UP, foot planted
            '--la-rot': -60, '--le-rot': 60,   // Arms binding behind back
            '--ra-rot': 120, '--re-rot': -60
        }
    },
    {
        id: 'kurmasana', name: 'Tortoise Pose (Kurmasana)', flow: ['baddha-konasana', 'upavistha-konasana'],
        desc: 'Seated with legs wide, torso folded flat to the floor, arms thread under the knees.',
        inherit: 'prasarita-padottanasana', // Wide legs, fold flat
        vars: {
            '--fig-rot': 180, // Flip upside down from standing wide legs to put it on the floor
            '--fig-y': 168,   // Sit on floor
            '--la-rot': 90, '--le-rot': 0, // Arms spread under legs
            '--ra-rot': -90, '--re-rot': 0
        }
    },
    {
        id: 'baddha-konasana', name: 'Bound Angle Pose (Baddha Konasana)', flow: ['upavistha-konasana', 'navasana'],
        desc: 'Seated with the soles of the feet together, knees dropped open to the sides. Hold feet and fold forward.',
        inherit: 'dandasana', 
        vars: {
            '--ub-rot': 30, '--head-rot': 20,
            '--ll-rot': -30, '--lk-rot': 120, 
            '--rl-rot': -30, '--rk-rot': 120,
            '--la-rot': -20, '--le-rot': 20, 
            '--ra-rot': -20, '--re-rot': 20
        }
    },
    {
        id: 'upavistha-konasana', name: 'Wide-Angle Seated Forward Bend (Upavistha Konasana)', flow: ['urdhva-dhanurasana', 'supta-konasana'],
        desc: 'Seated with legs wide open, fold torso straight forward to the floor, grabbing big toes.',
        inherit: 'kurmasana', 
        vars: {
            '--la-rot': -90, '--le-rot': 0, 
            '--ra-rot': -90, '--re-rot': 0
        }
    },
    {
        id: 'navasana', name: 'Boat Pose (Navasana)', flow: ['baddha-konasana', 'upavistha-konasana', 'kurmasana'],
        desc: 'Balance on your sit bones with your torso leaning back and your legs raised to form a V-shape.',
        vars: {
            '--fig-rot': 0, '--fig-x': -40, '--fig-y': 168,
            '--ub-rot': -45, '--head-rot': 15,
            '--la-rot': -65, '--le-rot': 0,
            '--ra-rot': -65, '--re-rot': 0,
            '--ll-rot': -135, '--lk-rot': 0,
            '--rl-rot': -135, '--rk-rot': 0,
            '--torso-cx': 70
        }
    },
    {
        id: 'purvottanasana', name: 'Upward Plank Pose (Purvottanasana)', flow: ['dandasana'],
        desc: 'From a seated position, place hands behind hips and press up into a reverse plank, keeping body straight.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 94,
            '--ub-rot': 62.5, '--head-rot': -45,
            '--la-rot': -62.5, '--le-rot': 0,
            '--ra-rot': -62.5, '--re-rot': 0,
            '--ll-rot': 62.5, '--lk-rot': 0,
            '--rl-rot': 62.5, '--rk-rot': 0
        }
    },
    {
        id: 'trikonasana', name: 'Triangle Pose - Right (Trikonasana)', flow: ['parivrtta-trikonasana', 'utthita-parsvakonasana', 'prasarita-padottanasana'],
        desc: 'Stand with legs wide, fold torso sideways over the front leg. One hand touches the ankle, the other reaches for the sky.',
        view: 'front',
        details: {
            head: 'Turn your head gently to gaze up past the thumb of your raised hand.',
            hands: 'Bottom hand rests lightly on shin or floor. Top hand reaches energetically towards the ceiling.',
            feet: 'Back foot angled at 45 degrees. Front foot pointing straight ahead.'
        },
        varsFront: {
            '--fig-y': 28,
            '--ub-rot-f': 90, '--head-rot-f': -90,
            '--la-rot-f': -105, '--le-rot-f': 0,
            '--ra-rot-f': -75, '--re-rot-f': 0,
            '--ll-rot-f': 40, '--lk-rot-f': 0,
            '--rl-rot-f': -40, '--rk-rot-f': 0
        },
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 38,
            '--ub-rot': 90, '--head-rot': 0,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': 40, '--lk-rot': 0,
            '--rl-rot': -40, '--rk-rot': 0
        }
    },
    {
        id: 'parivrtta-trikonasana', name: 'Revolved Triangle (Parivrtta Trikonasana)', flow: ['utthita-parsvakonasana'],
        desc: 'From Triangle Pose, revolve your torso so the opposite hand reaches for the floor and the other reaches for the sky.',
        inherit: 'trikonasana',
        vars: {
            '--la-rot': -90, '--le-rot': 0,
            '--ra-rot': 90, '--re-rot': 0
        }
    },
    {
        id: 'trikonasana-left', name: 'Triangle Pose - Left (Trikonasana)', flow: ['parivrtta-trikonasana-left'],
        desc: 'Stand with legs wide, fold sideways over the left leg. Left hand touches ankle, right reaches sky.',
        inherit: 'trikonasana',
        vars: {
            '--ub-rot': -90, '--head-rot': 0,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': 40, '--lk-rot': 0,
            '--rl-rot': -40, '--rk-rot': 0
        }
    },
    {
        id: 'parivrtta-trikonasana-left', name: 'Revolved Triangle - Left (Parivrtta Trikonasana)',
        desc: 'Revolve torso over the left leg. Right hand to the floor, left reaches sky.',
        inherit: 'trikonasana-left',
        vars: {
            '--la-rot': -90, '--le-rot': 0,
            '--ra-rot': 90, '--re-rot': 0
        }
    },
    {
        id: 'utthita-parsvakonasana', name: 'Extended Side Angle (Utthita Parsvakonasana)', flow: ['parivrtta-parsvakonasana', 'prasarita-padottanasana'],
        desc: 'Deep lunge. Torso leans over the bent leg. Lower hand touches the floor, upper arm extends diagonally over the ear.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 88,
            '--ub-rot': 60, '--head-rot': -37,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': -60, '--re-rot': 0,
            '--ll-rot': 60, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 90
        }
    },
    {
        id: 'parivrtta-parsvakonasana', name: 'Revolved Side Angle (Parivrtta Parsvakonasana)', flow: ['adho-mukha-svanasana'],
        desc: 'Lunge with torso twisted across the bent knee. Lower hand outside the foot, upper arm over the ear.',
        inherit: 'utthita-parsvakonasana',
        vars: {
            '--ub-rot': -120, // Twist backward across body
            '--la-rot': -60, '--le-rot': 0, // Left hand to floor
            '--ra-rot': -120, '--re-rot': 0  // Right arm reaches forward over ear (towards the front)
        }
    },
    {
        id: 'utthita-parsvakonasana-left', name: 'Extended Side Angle - Left (Utthita Parsvakonasana)', flow: ['parivrtta-parsvakonasana-left'],
        desc: 'Deep lunge on left leg. Torso leans over the bent leg. Left hand to floor, right arm over the ear.',
        inherit: 'utthita-parsvakonasana',
        vars: {
            '--ub-rot': -60, '--head-rot': 37,
            '--la-rot': 60, '--le-rot': 0,
            '--ra-rot': -180, '--re-rot': 0,
            '--ll-rot': 90, '--lk-rot': -90,
            '--rl-rot': -60, '--rk-rot': 0
        }
    },
    {
        id: 'parivrtta-parsvakonasana-left', name: 'Revolved Side Angle - Left (Parivrtta Parsvakonasana)',
        desc: 'Lunge on left leg, torso twisted across the knee. Right hand to floor, left arm over ear.',
        inherit: 'utthita-parsvakonasana-left',
        vars: {
            '--ub-rot': 120, 
            '--la-rot': 120, '--le-rot': 0,  // Left arm reaches forward over ear
            '--ra-rot': 60, '--re-rot': 0    // Right hand to floor
        }
    },
    {
        id: 'prasarita-padottanasana', name: 'Wide-Legged Forward Fold A (Prasarita Padottanasana)', flow: ['prasarita-padottanasana-b', 'kurmasana', 'parsvottanasana'],
        desc: 'Stand with legs wide apart. Hinge at the hips, bringing the crown of the head and hands toward the floor.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 38,
            '--ub-rot': 180, '--head-rot': 0,
            '--la-rot': 180, '--le-rot': 0,
            '--ra-rot': 180, '--re-rot': 0,
            '--ll-rot': 40, '--lk-rot': 0,
            '--rl-rot': -40, '--rk-rot': 0
        }
    },
    {
        id: 'prasarita-padottanasana-b', name: 'Wide-Legged Fold B (Prasarita Padottanasana B)', flow: ['prasarita-padottanasana-c'],
        desc: 'Wide-legged fold with hands firmly planted on the waist.',
        inherit: 'prasarita-padottanasana',
        vars: {
            '--la-rot': -90, '--le-rot': -90,
            '--ra-rot': 90, '--re-rot': 90
        }
    },
    {
        id: 'prasarita-padottanasana-c', name: 'Wide-Legged Fold C (Prasarita Padottanasana C)', flow: ['prasarita-padottanasana-d'],
        desc: 'Wide-legged fold with fingers interlaced behind the back and arms stretched overhead toward the floor.',
        inherit: 'prasarita-padottanasana',
        vars: {
            '--la-rot': -45, '--le-rot': 0, // Arms pointing overhead, falling towards floor (behind back)
            '--ra-rot': -45, '--re-rot': 0
        }
    },
    {
        id: 'prasarita-padottanasana-d', name: 'Wide-Legged Fold D (Prasarita Padottanasana D)', flow: ['ardha-uttanasana'],
        desc: 'Wide-legged fold grasping the big toes.',
        inherit: 'prasarita-padottanasana',
        vars: {
            '--la-rot': 160, '--le-rot': 0,
            '--ra-rot': -160, '--re-rot': 0
        }
    },
    {
        id: 'parsvottanasana', name: 'Pyramid Pose (Parsvottanasana)', flow: ['adho-mukha-svanasana'],
        desc: 'Fold torso over a straight front leg with hands in reverse prayer behind the back.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 24,
            '--ub-rot': 140, '--head-rot': 0,
            '--la-rot': -160, '--le-rot': -120,
            '--ra-rot': 160, '--re-rot': 120,
            '--ll-rot': 30, '--lk-rot': 0,
            '--rl-rot': -40, '--rk-rot': 0
        }
    },
    {
        id: 'urdhva-dhanurasana', name: 'Wheel Pose (Urdhva Dhanurasana)', flow: ['paschimottanasana', 'salamba-sarvangasana'],
        desc: 'Lie on your back, plant hands near ears and feet near hips, then press up to arch your spine into a wheel.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 48,
            '--ub-rot': -90, '--head-rot': -85,
            '--la-rot': -260, '--le-rot': 0,
            '--ra-rot': -260, '--re-rot': 0,
            '--ll-rot': -35, '--lk-rot': 85,
            '--rl-rot': -35, '--rk-rot': 85,
            '--torso-cx': 180
        }
    },
    {
        id: 'salamba-sarvangasana', name: 'Shoulder Stand (Salamba Sarvangasana)', flow: ['halasana', 'urdhva-padmasana'],
        desc: 'Support your back with your hands as you extend your legs and spine straight up to the ceiling, balancing on your shoulders.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 52,
            '--ub-rot': 180, '--head-rot': -90,
            '--la-rot': 0, '--le-rot': 0,
            '--ra-rot': 0, '--re-rot': 0,
            '--ll-rot': 180, '--lk-rot': 0,
            '--rl-rot': 180, '--rk-rot': 0
        }
    },
    {
        id: 'sirsasana', name: 'Headstand (Sirsasana)', flow: ['balasana'],
        desc: 'Invert completely, balancing on forearms with the crown of your head lightly on the floor. Legs reach straight up.',
        inherit: 'salamba-sarvangasana',
        vars: {
            '--head-rot': 0,
            '--fig-y': 60,
            '--la-rot': 135, '--le-rot': 90,
            '--ra-rot': 225, '--re-rot': -90
        }
    },
    {
        id: 'halasana', name: 'Plow Pose (Halasana)', flow: ['karnapidasana', 'supta-konasana', 'matsyasana'],
        desc: 'From Shoulder Stand, hinge at the hips to lower your toes to the floor beyond your head. Extend arms along the floor.',
        inherit: 'salamba-sarvangasana',
        vars: {
            '--la-rot': -90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': -45, '--lk-rot': 0,
            '--rl-rot': -45, '--rk-rot': 0,
            '--torso-cx': 50
        }
    },
    {
        id: 'karnapidasana', name: 'Ear Pressure Pose (Karnapidasana)', flow: ['supta-konasana', 'matsyasana'],
        desc: 'From Plow Pose, bend your knees and bring them to the floor beside your ears, pressing inward.',
        inherit: 'halasana',
        vars: {
            '--ll-rot': -120, '--lk-rot': -120,
            '--rl-rot': -120, '--rk-rot': -120
        }
    },
    {
        id: 'supta-konasana', name: 'Reclining Angle Pose (Supta Konasana)', flow: ['matsyasana'],
        desc: 'Lying on your back, legs swing overhead and open wide, hands grabbing the toes.',
        inherit: 'halasana', 
        vars: {
            '--ll-rot': 150, '--lk-rot': 0,
            '--rl-rot': 150, '--rk-rot': 0,
            '--la-rot': -150, '--le-rot': 0,
            '--ra-rot': -150, '--re-rot': 0
        }
    },
    {
        id: 'urdhva-padmasana', name: 'Upward Lotus (Urdhva Padmasana)', flow: ['pindasana'],
        desc: 'From Shoulder Stand, fold your legs into Lotus Pose and balance on your shoulders.',
        inherit: 'salamba-sarvangasana',
        vars: {
            '--ll-rot': 80, '--lk-rot': -160,  
            '--rl-rot': -80, '--rk-rot': 160  
        }
    },
    {
        id: 'pindasana', name: 'Embryo Pose (Pindasana)', flow: ['matsyasana', 'sirsasana'],
        desc: 'From Upward Lotus, fold the crossed legs down tightly toward your chest, wrapping arms around them.',
        inherit: 'urdhva-padmasana',
        vars: {
            '--ub-rot': -10, '--head-rot': 10, // weight shifts to upper back/neck
            '--ll-rot': -200, '--rk-rot': 160, // Swing lotus back to face deeply
            '--rl-rot': -180, '--lk-rot': -160, 
            '--la-rot': 150, '--le-rot': 60, // reach arms forward to wrap
            '--ra-rot': 150, '--re-rot': 60
        }
    },
    {
        id: 'matsyasana', name: 'Fish Pose (Matsyasana)', flow: ['savasana'],
        desc: 'Lie on your back, arch your upper body, and rest the crown of your head on the floor. Legs straight or in Lotus.',
        inherit: 'savasana',
        vars: {
            '--ub-rot': -30, '--head-rot': 45, // Arch upper back, tilt head back
            '--la-rot': 10, '--le-rot': -20, // elbows pressing into floor
            '--ra-rot': 10, '--re-rot': -20
        }
    },
    {
        id: 'savasana', name: 'Corpse Pose (Savasana)',
        desc: 'Lie completely flat on your back, arms relaxed at your sides, palms facing up. Focus entirely on your breath.',
        vars: {
            '--fig-rot': 90, '--fig-x': 0, '--fig-y': 150,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': 0, '--le-rot': 0,
            '--ra-rot': 0, '--re-rot': 0,
            '--ll-rot': 0, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'baddha-padmasana', name: 'Bound Lotus (Baddha Padmasana)', flow: ['padmasana'],
        desc: 'Sit in full lotus and bind your arms behind your back to grasp your opposite toes.',
        inherit: 'dandasana',
        vars: {
            '--fig-y': 155, // Hips almost on floor
            '--ll-rot': 80, '--lk-rot': -160,  // Left knee points left
            '--rl-rot': -80, '--rk-rot': 160,  // Right knee points right
            '--la-rot': -60, '--le-rot': 120,
            '--ra-rot': 60, '--re-rot': -120
        }
    },
    {
        id: 'padmasana', name: 'Lotus Pose (Padmasana)', flow: ['tolasana'],
        desc: 'Sit in full lotus with spine straight and hands resting on knees in Jnana mudra.',
        inherit: 'baddha-padmasana',
        vars: {
            '--la-rot': 40, '--le-rot': 40, // Hands resting on left knee
            '--ra-rot': -40, '--re-rot': -40 // Hands resting on right knee
        }
    },
    {
        id: 'tolasana', name: 'Scale Pose (Tolasana)', flow: ['savasana'],
        desc: 'From Lotus pose, press your hands into the floor and lift your entire body off the ground.',
        inherit: 'padmasana',
        vars: {
            '--fig-y': 100, // Lifted completely off the floor!
            '--la-rot': 0, '--le-rot': 0, // Arms lock straight down
            '--ra-rot': 0, '--re-rot': 0
        }
    },
    // NEW POSES:
    {
        id: 'phalakasana', name: 'Plank Pose (Phalakasana)', flow: ['chaturanga-dandasana'],
        desc: 'Top of a push-up with arms straight, body in one long line.',
        vars: {
            '--fig-rot': 0, '--fig-x': -50, '--fig-y': 100,
            '--ub-rot': 77, '--head-rot': -20,
            '--la-rot': -77, '--le-rot': 0,
            '--ra-rot': -77, '--re-rot': 0,
            '--ll-rot': 77, '--lk-rot': 0,
            '--rl-rot': 77, '--rk-rot': 0
        }
    },
    {
        id: 'bhujangasana', name: 'Cobra Pose (Bhujangasana)', flow: ['adho-mukha-svanasana', 'salamba-bhujangasana'],
        desc: 'Lie on your belly, press your hands into the floor, and lift your chest with elbows slightly bent.',
        vars: {
            '--fig-rot': 0, '--fig-x': -50, '--fig-y': 160,
            '--ub-rot': 40, '--head-rot': -20,
            '--la-rot': -20, '--le-rot': 40,
            '--ra-rot': -20, '--re-rot': 40,
            '--ll-rot': 80, '--lk-rot': 0,
            '--rl-rot': 80, '--rk-rot': 0,
            '--torso-cx': 140
        }
    },
    {
        id: 'salamba-bhujangasana', name: 'Sphinx Pose (Salamba Bhujangasana)', flow: ['bhujangasana', 'dhanurasana', 'balasana'],
        desc: 'Lie on your belly, prop yourself up on your forearms, elbows under shoulders. Lift your chest.',
        inherit: 'bhujangasana',
        vars: {
            '--ub-rot': 20, '--head-rot': -10,
            '--la-rot': -80, '--le-rot': 90,
            '--ra-rot': -80, '--re-rot': 90,
            '--torso-cx': 120
        }
    },
    {
        id: 'ardha-chandrasana', name: 'Half Moon Pose (Ardha Chandrasana)', flow: ['virabhadrasana-ii'],
        desc: 'Balance on one leg with the same hand on the floor, lifting the other leg parallel to the ground and extending the top arm up.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 30,
            '--ub-rot': 90, '--head-rot': 0,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': -90, '--re-rot': 0,
            '--ll-rot': 90, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'virabhadrasana-iii', name: 'Warrior III (Virabhadrasana III)', flow: ['urdhva-hastasana'],
        desc: 'Balance on one leg with the torso and raised leg parallel to the floor, arms extended forward.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 10,
            '--ub-rot': 90, '--head-rot': 0,
            '--la-rot': -180, '--le-rot': 0,
            '--ra-rot': -180, '--re-rot': 0,
            '--ll-rot': 90, '--lk-rot': 0,
            '--rl-rot': 0, '--rk-rot': 0
        }
    },
    {
        id: 'ashta-chandrasana', name: 'Crescent Lunge (Ashta Chandrasana)', flow: ['virabhadrasana-ii'],
        desc: 'Lunge with the front knee bent, back leg straight with heel lifted, and arms reaching straight up.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 40,
            '--ub-rot': 0, '--head-rot': 0,
            '--la-rot': -180, '--le-rot': 0,
            '--ra-rot': -180, '--re-rot': 0,
            '--ll-rot': -70, '--lk-rot': 70,
            '--rl-rot': 30, '--rk-rot': 0
        }
    },
    {
        id: 'viparita-virabhadrasana', name: 'Reverse Warrior (Viparita Virabhadrasana)', flow: ['trikonasana'],
        desc: 'From Warrior II, reach the front arm up and back while the back hand rests lightly on the back leg.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 88,
            '--ub-rot': -20, '--head-rot': -10,
            '--la-rot': 65, '--le-rot': 0,
            '--ra-rot': 160, '--re-rot': 0,
            '--ll-rot': 60, '--lk-rot': 0,
            '--rl-rot': -90, '--rk-rot': 90
        }
    },
    {
        id: 'bakasana', name: 'Crow Pose (Bakasana)', flow: ['chaturanga-dandasana'],
        desc: 'Balance on your hands with your knees resting on your upper arms and feet lifted floor.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 110,
            '--ub-rot': 70, '--head-rot': -20,
            '--la-rot': -70, '--le-rot': 0,
            '--ra-rot': -70, '--re-rot': 0,
            '--ll-rot': -80, '--lk-rot': 160,
            '--rl-rot': -80, '--rk-rot': 160
        }
    },
    {
        id: 'ustrasana', name: 'Camel Pose (Ustrasana)', flow: ['balasana'],
        desc: 'Kneel and lean back, arching your spine to reach your hands to your heels, pushing your hips forward.',
        vars: {
            '--fig-rot': 0, '--fig-x': 40, '--fig-y': 80,
            '--ub-rot': -70, '--head-rot': 40, // Let head drop backward
            '--la-rot': 65, '--le-rot': 0,
            '--ra-rot': 65, '--re-rot': 0,
            '--ll-rot': 0, '--lk-rot': 90,
            '--rl-rot': 0, '--rk-rot': 90,
            '--torso-cx': 170
        }
    },
    {
        id: 'natarajasana', name: 'Dancer\'s Pose (Natarajasana)', flow: ['tadasana'],
        desc: 'Balance on one foot, reaching the opposite arm forward while grabbing the lifted back foot with the other hand.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 10,
            '--ub-rot': 40, '--head-rot': 0,
            '--la-rot': 135, '--le-rot': 0, // Left arm reaches back and UP to grab the left foot
            '--ra-rot': -110, '--re-rot': 0, // Right arm reaches forward and slightly up
            '--ll-rot': 130, '--lk-rot': 80, // Left leg bent back and up
            '--rl-rot': 0, '--rk-rot': 0 // Right leg standing straight
        }
    },
    {
        id: 'dhanurasana', name: 'Bow Pose (Dhanurasana)', flow: ['adho-mukha-svanasana'],
        desc: 'Lie on your belly, bend your knees, reach back to grab your ankles, and lift your chest and thighs off the floor.',
        vars: {
            '--fig-rot': 0, '--fig-x': -40, '--fig-y': 170,
            '--ub-rot': 40, '--head-rot': 0,
            '--la-rot': 80, '--le-rot': 0,
            '--ra-rot': 80, '--re-rot': 0,
            '--ll-rot': 130, '--lk-rot': 60,
            '--rl-rot': 130, '--rk-rot': 60,
            '--torso-cx': 180
        }
    },
    {
        id: 'salabhasana', name: 'Locust Pose (Salabhasana)', flow: ['dhanurasana'],
        desc: 'Lie on your belly and lift your chest, arms, and legs off the floor, reaching arms back.',
        vars: {
            '--fig-rot': 0, '--fig-x': -40, '--fig-y': 170,
            '--ub-rot': 30, '--head-rot': 0,
            '--la-rot': 60, '--le-rot': 0,
            '--ra-rot': 60, '--re-rot': 0,
            '--ll-rot': 100, '--lk-rot': 0,
            '--rl-rot': 100, '--rk-rot': 0
        }
    },
    {
        id: 'setu-bandha-sarvangasana', name: 'Bridge Pose (Setu Bandha Sarvangasana)', flow: ['urdhva-dhanurasana'],
        desc: 'Lie on your back, bend your knees, press feet into the floor, and lift your hips high, clasping hands under your back.',
        vars: {
            '--fig-rot': 0, '--fig-x': 0, '--fig-y': 80,
            '--ub-rot': -135, '--head-rot': 0,
            '--la-rot': 45, '--le-rot': 0,
            '--ra-rot': 45, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': 90,
            '--rl-rot': -90, '--rk-rot': 90
        }
    },
    {
        id: 'bharmanasana', name: 'Table Top Pose (Bharmanasana)', flow: ['marjaryasana', 'bitilasana', 'adho-mukha-svanasana', 'phalakasana'],
        desc: 'On hands and knees, keep your spine neutral and flat like a table. Gaze straight down.',
        inherit: 'marjaryasana',
        vars: {
            '--ub-rot': 180, '--head-rot': 0,
            '--torso-cx': 100
        }
    },
    {
        id: 'marjaryasana', name: 'Cat Pose (Marjaryasana)', flow: ['bitilasana', 'adho-mukha-svanasana', 'balasana', 'bharmanasana'],
        desc: 'On hands and knees, exhale and round your spine toward the ceiling like an angry cat. Tuck your chin.',
        vars: {
            '--fig-rot': 90, '--fig-x': -40, '--fig-y': 150,
            '--ub-rot': 110, '--head-rot': 60,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': 90, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': -90,
            '--rl-rot': -90, '--rk-rot': -90,
            '--torso-cx': 50
        }
    },
    {
        id: 'bitilasana', name: 'Cow Pose (Bitilasana)', flow: ['marjaryasana', 'adho-mukha-svanasana', 'balasana', 'bharmanasana'],
        desc: 'On hands and knees, inhale and lift your sitting bones and chest toward the ceiling, allowing your belly to sink toward the floor.',
        vars: {
            '--fig-rot': 90, '--fig-x': -40, '--fig-y': 150,
            '--ub-rot': 250, '--head-rot': -30,
            '--la-rot': 90, '--le-rot': 0,
            '--ra-rot': 90, '--re-rot': 0,
            '--ll-rot': -90, '--lk-rot': -90,
            '--rl-rot': -90, '--rk-rot': -90,
            '--torso-cx': 150
        }
    },
    {
        id: 'ardha-pincha-mayurasana', name: 'Dolphin Pose (Ardha Pincha Mayurasana)', flow: ['adho-mukha-svanasana', 'sirsasana', 'marjaryasana', 'balasana'],
        desc: 'Similar to Downward Dog, but on forearms. Press your forearms into the floor and lift your hips up and back.',
        inherit: 'adho-mukha-svanasana',
        vars: {
            '--fig-y': 65,
            '--ub-rot': 130,
            '--la-rot': 150, '--le-rot': -90,
            '--ra-rot': 150, '--re-rot': -90,
            '--ll-rot': 30, '--lk-rot': 0,
            '--rl-rot': 30, '--rk-rot': 0
        }
    },
    {
        id: 'eka-pada-rajakapotasana', name: 'Pigeon Pose (Eka Pada Rajakapotasana)', flow: ['adho-mukha-svanasana', 'baddha-konasana'],
        desc: 'From Downward Dog, bring your right knee forward behind your right wrist. Extend your left leg straight back. Keep your hips square.',
        vars: {
            '--fig-rot': 0, '--fig-x': -40, '--fig-y': 150,
            '--ub-rot': 10, '--head-rot': -10,
            '--la-rot': 20, '--le-rot': 0,
            '--ra-rot': 20, '--re-rot': 0,
            '--ll-rot': 90, '--lk-rot': 0,
            '--rl-rot': -60, '--rk-rot': 120
        }
    }
];
