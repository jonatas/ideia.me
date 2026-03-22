const fs = require('fs');
let html = fs.readFileSync('yoga.html', 'utf8');

const flows = {
    'tadasana': "['urdhva-hastasana', 'uttanasana-a', 'utkatasana', 'vrksasana']",
    'urdhva-hastasana': "['uttanasana-a']",
    'uttanasana-a': "['ardha-uttanasana', 'padangusthasana']",
    'ardha-uttanasana': "['chaturanga-dandasana', 'uttanasana-a']",
    'padangusthasana': "['padahastasana', 'ardha-uttanasana']",
    'padahastasana': "['ardha-uttanasana']",
    'chaturanga-dandasana': "['urdhva-mukha-svanasana']",
    'urdhva-mukha-svanasana': "['adho-mukha-svanasana']",
    'adho-mukha-svanasana': "['virabhadrasana-i', 'virabhadrasana-i-left', 'trikonasana', 'trikonasana-left', 'ardha-uttanasana']",
    'utkatasana': "['uttanasana-a', 'virabhadrasana-i']",
    'virabhadrasana-i': "['virabhadrasana-ii', 'utthita-parsvakonasana', 'parivrtta-parsvakonasana']",
    'virabhadrasana-i-left': "['virabhadrasana-ii']",
    'virabhadrasana-ii': "['utthita-parsvakonasana', 'trikonasana', 'parsvottanasana']",
    'trikonasana': "['parivrtta-trikonasana', 'utthita-parsvakonasana', 'prasarita-padottanasana']",
    'parivrtta-trikonasana': "['utthita-parsvakonasana']",
    'utthita-parsvakonasana': "['parivrtta-parsvakonasana', 'prasarita-padottanasana']",
    'parivrtta-parsvakonasana': "['adho-mukha-svanasana']",
    'trikonasana-left': "['parivrtta-trikonasana-left']",
    'utthita-parsvakonasana-left': "['parivrtta-parsvakonasana-left']",
    'prasarita-padottanasana': "['prasarita-padottanasana-b', 'kurmasana', 'parsvottanasana']",
    'prasarita-padottanasana-b': "['prasarita-padottanasana-c']",
    'prasarita-padottanasana-c': "['prasarita-padottanasana-d']",
    'prasarita-padottanasana-d': "['ardha-uttanasana']",
    'parsvottanasana': "['adho-mukha-svanasana']",
    'dandasana': "['paschimottanasana', 'purvottanasana', 'janu-sirsasana', 'marichyasana-a', 'navasana']",
    'paschimottanasana': "['ardha-baddha-padma-paschimottanasana', 'triang-mukha-eka-pada-paschimottanasana', 'purvottanasana']",
    'ardha-baddha-padma-paschimottanasana': "['paschimottanasana']",
    'triang-mukha-eka-pada-paschimottanasana': "['janu-sirsasana']",
    'janu-sirsasana': "['marichyasana-a']",
    'marichyasana-a': "['navasana']",
    'navasana': "['baddha-konasana', 'upavistha-konasana', 'kurmasana']",
    'kurmasana': "['baddha-konasana', 'upavistha-konasana']",
    'baddha-konasana': "['upavistha-konasana', 'navasana']",
    'upavistha-konasana': "['urdhva-dhanurasana', 'supta-konasana']",
    'purvottanasana': "['dandasana']",
    'urdhva-dhanurasana': "['paschimottanasana', 'salamba-sarvangasana']",
    'salamba-sarvangasana': "['halasana', 'urdhva-padmasana']",
    'halasana': "['karnapidasana', 'supta-konasana', 'matsyasana']",
    'karnapidasana': "['supta-konasana', 'matsyasana']",
    'supta-konasana': "['matsyasana']",
    'urdhva-padmasana': "['pindasana']",
    'pindasana': "['matsyasana', 'sirsasana']",
    'sirsasana': "['balasana']",
    'balasana': "['dandasana', 'savasana']",
    'matsyasana': "['savasana']",
    'baddha-padmasana': "['padmasana']",
    'padmasana': "['tolasana']",
    'tolasana': "['savasana']"
};

for (const [id, flow] of Object.entries(flows)) {
    const rx = new RegExp(`(id:\\s*'${id}'.*?)(name:\\s*'.*?',)`, "s");
    html = html.replace(rx, `$1$2 flow: ${flow},`);
}

fs.writeFileSync('yoga.html', html);
console.log("Injected flows successfully");
