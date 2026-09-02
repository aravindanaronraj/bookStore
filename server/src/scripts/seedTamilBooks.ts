import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db";
import Category from "../models/Category";
import Book from "../models/Book";
import User from "../models/User";

const categories = [
  ["தமிழ் இலக்கியம்", "tamil-literature", "தமிழின் சிறந்த இலக்கியப் படைப்புகள்"],
  ["நாவல்கள்", "novels", "மனதைத் தொடும் தமிழ் நாவல்கள்"],
  ["சிறார் நூல்கள்", "children-books", "குழந்தைகளுக்கான கதை மற்றும் அறிவு நூல்கள்"],
  ["வரலாறு", "history", "தமிழர் மற்றும் உலக வரலாற்று நூல்கள்"],
  ["வாழ்வியல்", "lifestyle", "தன்னம்பிக்கை மற்றும் வாழ்வியல் வழிகாட்டிகள்"],
] as const;

const books = [
  ["பொன்னியின் செல்வன் - முதல் பாகம்", "ponniyin-selvan-part-1", "கல்கி கிருஷ்ணமூர்த்தி", "தமிழ் இலக்கியம்", "சோழப் பேரரசின் அரசியல் சூழ்ச்சிகள், வீரப் பயணங்கள் மற்றும் வந்தியத்தேவனின் சாகசங்களை உயிரோட்டமாக விவரிக்கும் வரலாற்றுப் புதினத்தின் முதல் பாகம்.", 399, 349, 25, 320],
  ["சிவகாமியின் சபதம்", "sivagamiyin-sabatham", "கல்கி கிருஷ்ணமூர்த்தி", "வரலாறு", "பல்லவர் காலக் கலை, காதல், போர் மற்றும் பழிவாங்கும் சபதத்தை மையமாகக் கொண்ட தமிழின் புகழ்பெற்ற வரலாற்றுப் புதினம்.", 450, 399, 18, 560],
  ["பாரதியார் கவிதைகள்", "bharathiyar-kavithaigal", "சுப்பிரமணிய பாரதியார்", "தமிழ் இலக்கியம்", "விடுதலை, சமத்துவம், பெண்மை, இயற்கை மற்றும் மனிதநேயம் குறித்து மகாகவி பாரதியார் எழுதிய ஊக்கமூட்டும் கவிதைகளின் தொகுப்பு.", 250, 219, 40, 280],
  ["திருக்குறள் - தெளிவுரை", "thirukkural-thelivurai", "திருவள்ளுவர்", "தமிழ் இலக்கியம்", "அறம், பொருள், இன்பம் ஆகிய மூன்று வாழ்வியல் தளங்களையும் எளிய தமிழில் விளக்கும் 1330 குறள்களும் தெளிவான உரையும் கொண்ட பதிப்பு.", 300, 269, 35, 420],
  ["கடல் கடந்த கனவுகள்", "kadal-kadantha-kanavugal", "மீனா செந்தில்", "நாவல்கள்", "ஒரு சிற்றூரிலிருந்து கடல் கடந்து செல்லும் இளம் பெண்ணின் கல்வி, உறவு மற்றும் சுயதேடல் பயணத்தைச் சொல்லும் நவீன தமிழ் நாவல்.", 320, 279, 22, 248],
  ["மழைக்கால நினைவுகள்", "mazhaikkala-ninaivugal", "ஆதவன் குமார்", "நாவல்கள்", "மழையோடு திரும்பும் குழந்தைப் பருவ நினைவுகள் வழியாக குடும்ப உறவுகளையும் மறக்கப்பட்ட அன்பையும் மீட்டெடுக்கும் உணர்வுப்பூர்வமான கதை.", 290, 249, 20, 216],
  ["நிலாவும் நட்சத்திர நண்பர்களும்", "nilavum-natchathira-nanbargalum", "கயல்விழி", "சிறார் நூல்கள்", "நிலாவுடன் பயணம் செய்யும் சிறுவன் வழியாக நட்பு, பகிர்வு, துணிவு ஆகியவற்றைக் குழந்தைகளுக்கு அழகான கதைகளால் அறிமுகப்படுத்தும் நூல்.", 180, 159, 30, 64],
  ["அறிவியல் கதைகள் - சிறார்களுக்கு", "ariviyal-kathaigal-sirar", "டாக்டர் அருண்", "சிறார் நூல்கள்", "அன்றாட நிகழ்வுகளின் பின்னுள்ள அறிவியலை சுவையான கதைகள், எளிய சோதனைகள் மற்றும் சிந்தனை கேள்விகளுடன் விளக்கும் குழந்தைகள் நூல்.", 220, 189, 28, 96],
  ["தமிழர் நாகரிகப் பயணம்", "tamilar-nagariga-payanam", "முனைவர் இரா. வேலன்", "வரலாறு", "சங்க காலம் முதல் நவீன காலம் வரை தமிழரின் மொழி, வணிகம், கலை, கட்டிடக்கலை மற்றும் சமூக வாழ்வின் வளர்ச்சியை ஆதாரங்களுடன் அறிமுகப்படுத்தும் நூல்.", 480, 429, 16, 384],
  ["ஒவ்வொரு நாளும் ஒரு புதிய தொடக்கம்", "ovvoru-naalum-puthiya-thodakkam", "லதா ராமன்", "வாழ்வியல்", "சிறிய பழக்கங்கள், நேர மேலாண்மை, மன அமைதி மற்றும் தெளிவான இலக்குகள் மூலம் தினசரி வாழ்க்கையை மேம்படுத்த உதவும் நடைமுறை வழிகாட்டி.", 275, 239, 24, 192],
] as const;

export const seedDefaultAdmin = async () => {
  const email = "admin@thooral.com";
  const password = "Admin@123";

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return existingUser;
  }

  const admin = await User.create({
    name: "Thooral Admin",
    email,
    phone: "9876543210",
    password: await bcrypt.hash(password, 10),
    role: "admin",
    staffApproval: "approved",
    permissions: ["dashboard", "products", "orders", "customers"],
    isEmailVerified: true,
  });

  return admin;
};

export const seedTamilBooks = async () => {
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();

  for (const [name, slug, description] of categories) {
    const category = await Category.findOneAndUpdate(
      { slug },
      { $set: { name, description, isActive: true } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    categoryMap.set(name, category._id as mongoose.Types.ObjectId);
  }

  if ((await Book.countDocuments()) === 0) {
    for (const [title, slug, author, categoryName, description, price, salePrice, stock, pages] of books) {
      await Book.findOneAndUpdate(
        { slug },
        {
          $set: {
            title,
            author,
            category: categoryMap.get(categoryName),
            description,
            price,
            salePrice,
            stock,
            pages,
            language: "Tamil",
            bookType: "physical",
            isActive: true,
            isFeatured: true,
            isNewLaunch: true,
            images: [],
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
    }
  }

  console.log(`Seeded ${categories.length} categories and ${books.length} Tamil books.`);
};

export const seedAllDefaults = async () => {
  await seedDefaultAdmin();
  await seedTamilBooks();
};

const run = async () => {
  await connectDB();
  await seedAllDefaults();
  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
}
