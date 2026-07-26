import { Inter } from 'next/font/google'
import Header from "@/components/header2"

const inter = Inter({ subsets: ['latin'] })

const oils = [
  {
    name: "Olive Oil (Extra Virgin)",
    benefits: [
      "Rich in monounsaturated fats, which are heart-healthy.",
      "High in antioxidants and anti-inflammatory compounds.",
      "Linked to lower risks of heart disease and improved cholesterol levels."
    ]
  },
  {
    name: "Avocado Oil",
    benefits: [
      "Contains monounsaturated fats and vitamin E.",
      "Supports heart health and improves the absorption of fat-soluble vitamins.",
      "Great for high-heat cooking due to its high smoke point."
    ]
  },
  {
    name: "Coconut Oil",
    benefits: [
      "Contains medium-chain triglycerides (MCTs), which may boost metabolism.",
      "Good for brain health and energy.",
      "Contains some saturated fat, but the type of fat is different from that in animal-based fats."
    ]
  },
  {
    name: "Flaxseed Oil",
    benefits: [
      "High in omega-3 fatty acids, which support heart and brain health.",
      "May reduce inflammation and promote a healthy cholesterol balance.",
      "Should be used cold, as it is sensitive to heat."
    ]
  },
  {
    name: "Walnut Oil",
    benefits: [
      "Rich in omega-3 fatty acids and antioxidants.",
      "Good for heart health and may improve brain function.",
      "Best used in dressings or as a finishing oil due to its low smoke point."
    ]
  },
  {
    name: "Almond Oil",
    benefits: [
      "High in monounsaturated fats, vitamin E, and antioxidants.",
      "Supports heart health and has anti-inflammatory properties.",
      "Great for skin health as well, often used topically."
    ]
  },
  {
    name: "Sesame Oil",
    benefits: [
      "Contains both monounsaturated and polyunsaturated fats.",
      "Rich in antioxidants like sesamol, which may reduce inflammation.",
      "Ideal for cooking at moderate heat or as a finishing oil."
    ]
  },
  {
    name: "Ghee (Clarified Butter)",
    benefits: [
      "Contains butyrate, a short-chain fatty acid with anti-inflammatory benefits.",
      "Lactose-free, making it suitable for those with lactose intolerance.",
      "Best used for high-heat cooking due to its high smoke point."
    ]
  },
  {
    name: "Hemp Oil",
    benefits: [
      "High in omega-3 and omega-6 fatty acids in an optimal ratio.",
      "Supports brain function, skin health, and heart health.",
      "Best used in cold dishes like salads or drizzled over cooked food."
    ]
  },
  {
    name: "Pumpkin Seed Oil",
    benefits: [
      "Rich in zinc, omega-3 fatty acids, and antioxidants.",
      "Supports prostate health and is anti-inflammatory.",
      "Best used as a finishing oil or in salad dressings."
    ]
  },
  {
    name: "Chia Seed Oil",
    benefits: [
      "High in omega-3 fatty acids, particularly ALA (alpha-linolenic acid).",
      "Supports heart health, reduces inflammation, and enhances skin health.",
      "Best used in cold dishes or as a salad dressing."
    ]
  },
  {
    name: "Safflower Oil (High Oleic Variety)",
    benefits: [
      "Rich in monounsaturated fats, making it heart-healthy.",
      "A good source of vitamin E, an antioxidant that supports skin and eye health.",
      "Can be used for high-heat cooking due to its high smoke point."
    ]
  },
  {
    name: "Rice Bran Oil",
    benefits: [
      "Contains healthy monounsaturated and polyunsaturated fats.",
      "Rich in oryzanol, which may help lower cholesterol levels.",
      "Its high smoke point makes it ideal for stir-frying and deep-frying."
    ]
  },
  {
    name: "Macadamia Nut Oil",
    benefits: [
      "High in monounsaturated fats and antioxidants.",
      "Supports heart health and may reduce inflammation.",
      "Has a high smoke point, making it suitable for high-heat cooking."
    ]
  },
  {
    name: "Mustard Oil",
    benefits: [
      "Contains omega-3 fatty acids and antioxidants like vitamin E.",
      "Known for its anti-inflammatory and antibacterial properties.",
      "Widely used in Indian cooking, particularly for sautéing and stir-frying."
    ]
  },
  {
    name: "Pecan Oil",
    benefits: [
      "Rich in monounsaturated fats and antioxidants.",
      "Supports heart health and has anti-inflammatory effects.",
      "Great for baking, sautéing, or drizzling over dishes."
    ]
  },
  {
    name: "Evening Primrose Oil",
    benefits: [
      "Contains gamma-linolenic acid (GLA), an omega-6 fatty acid with anti-inflammatory properties.",
      "Supports hormonal balance and skin health.",
      "Best used as a supplement or in skincare, as it is not typically used for cooking."
    ]
  },
  {
    name: "Camu Camu Seed Oil",
    benefits: [
      "Rich in vitamin C and antioxidants.",
      "Known for its skin benefits, improving skin tone and elasticity.",
      "Used more for skin care rather than cooking."
    ]
  },
  {
    name: "Tallow (Beef Fat)",
    benefits: [
      "A good source of conjugated linoleic acid (CLA), which may have anti-cancer properties.",
      "Supports energy levels and may promote fat loss.",
      "Used for high-heat cooking, though it is high in saturated fat, so should be consumed in moderation."
    ]
  },
  {
    name: "Lipid-Rich Fish Oil (e.g., Salmon Oil)",
    benefits: [
      "High in omega-3 fatty acids EPA and DHA, which are excellent for brain, heart, and joint health.",
      "Known for reducing inflammation and improving cardiovascular health.",
      "Typically consumed as a supplement, though some people use it in cooking."
    ]
  }
];

export default function Home() {
  return (
    <main className={`min-h-screen p-8 ${inter.className}`}><Header/><header>
      <h1 className="text-4xl font-bold mt-12 mb-8 text-center">Top 20 Healthy Oils for Software Developers</h1>
      <p className="mb-8 text-lg text-center">
        As a software developer, maintaining a healthy lifestyle is crucial. One way to do this is by incorporating healthy oils into your diet. Here are 20 of the healthiest oils you can use, each with distinct health benefits:
      </p></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {oils.map((oil, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{index + 1}. {oil.name}</h2>
            <ul className="list-disc pl-5">
              {oil.benefits.map((benefit, benefitIndex) => (
                <li key={benefitIndex} className="mb-2">{benefit}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-lg text-center">
        These oils can be used in various ways, depending on the type of cooking you're doing or for incorporating into dressings and cold dishes. Remember, a balanced diet with healthy fats can support your cognitive function and overall well-being, which is essential for software developers who often engage in mentally demanding tasks.
      </p>
    </main>
  )
}

