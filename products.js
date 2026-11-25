/* ============================================================
   PRODUCTS shown on item.html (open as item.html?p=<id>, e.g. item.html?p=top)

   For each product:
     name, eyebrow, intro    -> { el: 'Greek', en: 'English' }
     composition             -> { el, en } fabric composition, shown under "Made in Greece" (optional)
     price                   -> number, or null while unknown (the price and "Add to basket" stay hidden)
     sizes                   -> e.g. ['S', 'M', 'L'], or [] if not set yet (the size picker is hidden)
     colors                  -> { name, c1, c2, images: [] }; add photo paths to `images`,
                                e.g. 'images/top/pine-green-1.jpg'. While empty, a colour placeholder shows.
                                Leave `colors` as [] if not set yet.
     panels                  -> the info boxes under the product (one or two). Each has a title and
                                optionally: items (bullet list), text (paragraph), tip (the "Extra tip").
   ============================================================ */

window.PRODUCTS = {
  leggings: {
    name: { el: 'Κολάν', en: 'High-Rise Leggings' },
    eyebrow: { el: 'Ψηλόμεσο αθλητικό κολάν', en: 'High-rise sports leggings' },
    intro: {
      el: 'Ψηλόμεσο αθλητικό κολάν που ακολουθεί φυσικά τις καμπύλες σου, προσφέροντας τέλεια εφαρμογή χωρίς να διαφανίζει.',
      en: 'High-rise sports leggings that naturally follow your curves, giving you a perfect fit that is never see-through.'
    },
    price: null,
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Chocolate Brown', c1: '#6A4532', c2: '#36231A', images: [] },
      { name: 'Pine Green',      c1: '#3E5A48', c2: '#1F3328', images: [] },
      { name: 'Navy Blue',       c1: '#3A4A6B', c2: '#1A2438', images: [] }
    ],
    panels: [
      {
        title: { el: 'Τι το κάνει ξεχωριστό', en: 'What makes them special' },
        items: {
          el: [
            'Καμπυλωτή ραφή στο πίσω μέρος που αναδεικνύει τη σιλουέτα με διακριτική κομψότητα.',
            'Κατασκευασμένο από premium ύφασμα, 4 way stretch, που προσφέρει μεγάλη ελαστικότητα και άνεση στις κινήσεις.',
            'Αξιόπιστη απορρόφηση ιδρώτα & γρήγορο στέγνωμα.'
          ],
          en: [
            'A curved seam at the back that shapes your silhouette with subtle elegance.',
            'Made from premium 4-way stretch fabric that gives great elasticity and freedom of movement.',
            'Reliable sweat absorption & quick drying.'
          ]
        }
      },
      {
        title: { el: 'Πότε & πώς να το φορέσεις', en: 'When & how to wear them' },
        items: {
          el: [
            'Ιδανικό για Yoga, Pilates, γυμναστήριο, τρέξιμο αλλά και casual στιγμές.',
            'Συνδύασέ το με το μπλουζάκι για ολοκληρωμένη και αρμονική εμφάνιση.',
            'Διαθέσιμα νούμερα: S - M - L',
            'Κατασκευασμένο στην Ελλάδα.'
          ],
          en: [
            'Ideal for yoga, Pilates, the gym, running and casual moments too.',
            'Pair them with the top for a complete, harmonious look.',
            'Available sizes: S - M - L',
            'Made in Greece.'
          ]
        },
        tip: {
          el: 'Συνδύασέ το με ένα oversized σακάκι ή το παλτό σου και το φούτερ σου, με αθλητικά παπούτσια ή τα αρβυλάκια σου, και είσαι όμορφη και άνετη για βόλτες, ψώνια, καφέ και ό,τι άλλο προκύψει 😉',
          en: "Pair them with an oversized blazer or your coat and a sweatshirt, with trainers or your boots, and you're beautiful and comfortable for walks, shopping, coffee and whatever else comes up 😉"
        }
      }
    ]
  },

  top: {
    name: { el: 'Top', en: 'Top' },
    eyebrow: { el: 'Αμάνικο ελαστικό μπλουζάκι', en: 'Sleeveless stretch top' },
    intro: {
      el: 'Αμάνικο ελαστικό μπλουζάκι σε μοντέρνα γραμμή, που αγκαλιάζει το σώμα με άνεση.',
      en: 'A sleeveless stretch top with a modern line that hugs your body comfortably.'
    },
    price: null,
    composition: { el: '78% PL 22% EA', en: '78% Polyester – 22% Elastane' },
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Chocolate Brown', c1: '#6A4532', c2: '#36231A', images: [] },
      { name: 'Pine Green',      c1: '#3E5A48', c2: '#1F3328', images: [] },
      { name: 'Navy Blue',       c1: '#3A4A6B', c2: '#1A2438', images: [] }
    ],
    panels: [
      {
        title: { el: 'Τι το κάνει ξεχωριστό', en: 'What makes it special' },
        items: {
          el: [
            'Κατασκευασμένο από premium ύφασμα, 4 way stretch, που προσφέρει μεγάλη ελαστικότητα και ελευθερία κινήσεων.',
            'Αξιόπιστη απορρόφηση ιδρώτα & γρήγορο στέγνωμα.'
          ],
          en: [
            'Made from premium 4-way stretch fabric that gives great elasticity and freedom of movement.',
            'Reliable sweat absorption & quick drying.'
          ]
        }
      },
      {
        title: { el: 'Πότε & πώς να το φορέσεις', en: 'When & how to wear it' },
        items: {
          el: [
            'Ιδανικό για Yoga, Pilates, γυμναστήριο αλλά και για casual sporty εμφανίσεις.',
            'Διαθέσιμα νούμερα: S - M - L',
            'Κατασκευασμένο στην Ελλάδα.'
          ],
          en: [
            'Ideal for yoga, Pilates, the gym and casual sporty looks too.',
            'Available sizes: S - M - L',
            'Made in Greece.'
          ]
        },
        tip: {
          el: 'Συνδύασέ το με ένα oversized σακάκι ή το παλτό σου και το φούτερ σου, με αθλητικά παπούτσια ή τα αρβυλάκια σου, και είσαι όμορφη και άνετη για βόλτες, ψώνια, καφέ και ό,τι άλλο προκύψει 😉',
          en: "Pair it with an oversized blazer or your coat and a sweatshirt, with trainers or your boots, and you're beautiful and comfortable for walks, shopping, coffee and whatever else comes up 😉"
        }
      }
    ]
  },

  tshirt: {
    name: { el: 'Μπλούζα', en: 'T-shirt' },
    eyebrow: { el: '✨ The Signature Coordinates T-Shirt', en: '✨ The Signature Coordinates T-Shirt' },
    intro: {
      el: 'Από 100% premium, βαρύ βαμβάκι που διατηρεί την άψογη, oversized γραμμή του όλη μέρα.',
      en: 'Made from 100% premium heavyweight cotton that keeps its flawless oversized shape all day.'
    },
    price: null,
    composition: { el: '78% PL 22% EA', en: '78% Polyester – 22% Elastane' },
    sizes: [],   // not set yet, e.g. ['S', 'M', 'L']
    colors: [],  // not set yet
    panels: [
      {
        title: { el: 'Τι την κάνει ξεχωριστή', en: 'What makes it special' },
        items: {
          el: [
            'Minimal fine-line σχεδιασμός για τη σύγχρονη γυναίκα που αγαπά την αισθητική του quiet luxury.',
            'Ιδανικό για να φορεθεί πάνω από το κολάν ή το biker short σου, από την προπόνηση μέχρι την urban βόλτα σου.'
          ],
          en: [
            'Minimal fine-line design for the modern woman who loves the quiet luxury aesthetic.',
            'Ideal to wear over your leggings or biker shorts, from training to your city stroll.'
          ]
        }
      },
      {
        title: { el: 'Own Your Peak', en: 'Own Your Peak' },
        text: {
          el: 'Κάθε φορά που το φοράς στο γυμναστήριο, στο studio του Pilates, στο τρέξιμο ή στη βόλτα σου, θέλουμε να θυμάσαι το δικό μας σλόγκαν: Own Your Peak.',
          en: 'Every time you wear it at the gym, in the Pilates studio, on your run or out for a walk, we want it to remind you of our motto: Own Your Peak.'
        },
        items: {
          el: ['Κατασκευασμένο στην Ελλάδα.'],
          en: ['Made in Greece.']
        }
      }
    ]
  },

  hoodie: {
    name: { el: 'Φούτερ', en: 'Hoodie' },
    eyebrow: { el: 'Oversized hoodie με κουκούλα', en: 'Oversized hoodie' },
    intro: {
      el: 'Oversized Hoodie με κουκούλα, κατασκευασμένο από υψηλής ποιότητας φούτερ με εσωτερική επένδυση.',
      en: 'An oversized hoodie made from high-quality sweatshirt fabric with an inner lining.'
    },
    price: null,
    composition: { el: '80% Cotton – 20% Polyester', en: '80% Cotton – 20% Polyester' },
    sizes: [],   // not set yet
    colors: [],  // not set yet
    panels: [
      {
        title: { el: 'Τι το κάνει ξεχωριστό', en: 'What makes it special' },
        items: {
          el: [
            'Super απαλό, προσφέρει άνεση και σταθερή εφαρμογή.',
            'Kangaroo Pouch Pocket',
            'Dropped Shoulder',
            'Κατασκευασμένο στην Ελλάδα.'
          ],
          en: [
            'Super soft, giving you comfort and a fit that stays in place.',
            'Kangaroo pouch pocket',
            'Dropped shoulder',
            'Made in Greece.'
          ]
        }
      }
    ]
  }
};
