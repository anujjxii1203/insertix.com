import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  createProject,
  createTeamMember,
  createTestimonial,
  createContactMessage,
  createAdmin,
  connectDB,
} from "../lib/db";
import {
  IProject,
  ITeamMember,
  ITestimonial,
  IContactMessage,
  IAdmin,
  ProjectModel,
  TeamMemberModel,
  TestimonialModel,
  ContactMessageModel,
  AdminModel,
} from "../lib/models";

const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");

export async function seed() {
  console.log("🌱 Starting Insertix Media database seed...");

  const hasMongo = await connectDB();
  if (hasMongo) {
    await ProjectModel.deleteMany({});
    await TeamMemberModel.deleteMany({});
    await TestimonialModel.deleteMany({});
    await ContactMessageModel.deleteMany({});
    await AdminModel.deleteMany({});
  } else {
    // Reset local JSON DB collections
    let localData: any = { projects: [], team: [], testimonials: [], contactMessages: [], admins: [] };
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        localData = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      } catch {
        // default
      }
    }
    localData.projects = [];
    localData.team = [];
    localData.testimonials = [];
    localData.contactMessages = [];
    localData.admins = [];
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(localData, null, 2), "utf-8");
  }

  // 1. Admin
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
  const admin: IAdmin = {
    id: "admin-1",
    email: process.env.ADMIN_EMAIL || "admin@insertixmedia.com",
    name: "Insertix Director",
    passwordHash: adminPasswordHash,
    role: "admin",
  };
  await createAdmin(admin);
  console.log(`✅ Admin seeded: ${admin.email}`);

  // 2. 10 Projects Total (2 per category: video, photo, product, event, marketing)
  const projects: IProject[] = [
    // Video Shoots (2 projects)
    {
      id: "proj-video-1",
      title: "Zomato Gold Commercial & Cinema Ad",
      category: "video",
      client: "Zomato Dining",
      description:
        "High-octane commercial ad shot on cinema cameras with precision lighting and rhythmic color-graded cuts for premier city dining.",
      coverImage: "/projects/proj-video-1.webp",
      videoPreview: "",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      featured: true,
      deliverables: ["4K Cinema Ad", "60s Brand Film", "Reels & Short-Form Cutdowns"],
      metrics: "4.8M Views",
      year: "2025",
      createdAt: new Date("2025-02-15").toISOString(),
    },
    {
      id: "proj-video-2",
      title: "Tata EV Festive Campaign Film",
      category: "video",
      client: "Tata Motors Passenger",
      description:
        "Cinematic night-shoot brand film capturing sleek vehicle lines, urban nightlife reflections, and seamless sound design across Mumbai.",
      coverImage: "/projects/proj-video-2.webp",
      videoPreview: "",
      link: "https://vimeo.com/76979871",
      featured: true,
      deliverables: ["Hero Commercial", "Instagram Reels Series", "Cinema Surround Mix"],
      metrics: "2.1M Views in 48h",
      year: "2024",
      createdAt: new Date("2024-11-10").toISOString(),
    },

    // Photoshoots (2 projects)
    {
      id: "proj-photo-1",
      title: "Fabindia Heritage Festive Lookbook",
      category: "photo",
      client: "Fabindia Textiles",
      description:
        "Outdoor and royal palace portrait photography capturing hand-embroidered silks with warm natural lighting and editorial retouching.",
      coverImage: "/projects/proj-photo-1.webp",
      videoPreview: "",
      link: "https://www.instagram.com/insertixmedia",
      featured: true,
      deliverables: ["Festive Lookbook", "Outdoor Portrait Suite", "High-End Retouching"],
      metrics: "Sold Out in 4 Days",
      year: "2025",
      createdAt: new Date("2025-01-20").toISOString(),
    },
    {
      id: "proj-photo-2",
      title: "CRED Executive Leadership Portraits",
      category: "photo",
      client: "CRED Financial",
      description:
        "Minimalist studio portraiture and team lifestyle shoot with precision rim lighting for press releases and executive profiles.",
      coverImage: "/projects/proj-photo-2.webp",
      videoPreview: "",
      link: "https://drive.google.com/drive/folders/sample-cred-portraits",
      featured: false,
      deliverables: ["Studio Executive Portraits", "Editorial Press Kit", "Location Team Shoot"],
      metrics: "National Press Feature",
      year: "2024",
      createdAt: new Date("2024-10-18").toISOString(),
    },

    // Product Shoot (2 projects)
    {
      id: "proj-product-1",
      title: "boAt Nirvana ANC Earbuds Commercial Shoot",
      category: "product",
      client: "boAt Lifestyle",
      description:
        "Crisp white-background and dynamic splash lifestyle product shoot for flagship noise-cancelling earbuds on e-commerce portals.",
      coverImage: "/projects/proj-product-1.webp",
      videoPreview: "",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      featured: true,
      deliverables: ["White-Background E-Com Set", "Dynamic Water-Splash Shots", "360° Rotating Views"],
      metrics: "3.4x Sales Surge",
      year: "2025",
      createdAt: new Date("2025-03-01").toISOString(),
    },
    {
      id: "proj-product-2",
      title: "Forest Essentials Ayurveda Luxury Catalogue",
      category: "product",
      client: "Forest Essentials",
      description:
        "Premium botanical ingredient staging and glass-bottle lighting capturing rich organic textures for marketplace and print catalogues.",
      coverImage: "/projects/proj-product-2.webp",
      videoPreview: "",
      link: "https://www.instagram.com/insertixmedia",
      featured: false,
      deliverables: ["Catalogue Stills", "Macro Texture Stills", "Marketplace Ready Assets"],
      metrics: "Sold Out in 3 Days",
      year: "2024",
      createdAt: new Date("2024-09-14").toISOString(),
    },

    // Event Shoots (2 projects)
    {
      id: "proj-event-1",
      title: "Sunburn Goa Mainstage Aftermovie & Drone",
      category: "event",
      client: "Percept Live",
      description:
        "Multi-camera live concert coverage with synchronous FPV drone fly-throughs, stage pyrotechnics, and same-night teaser edits.",
      coverImage: "/projects/proj-event-1.webp",
      videoPreview: "",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      featured: true,
      deliverables: ["4K Festival Aftermovie", "FPV Drone Coverage", "Real-Time Artist Reels"],
      metrics: "85K+ Crowd Captured",
      year: "2024",
      createdAt: new Date("2024-12-28").toISOString(),
    },
    {
      id: "proj-event-2",
      title: "Royal Udaipur Destination Wedding Coverage",
      category: "event",
      client: "The Oberoi Udaivilas",
      description:
        "Grand 3-day destination royal wedding immortalized with cinematic 4K film, candid photo moments, and high-energy sangeet highlights.",
      coverImage: "/projects/proj-event-2.webp",
      videoPreview: "",
      link: "https://www.instagram.com/insertixmedia",
      featured: false,
      deliverables: ["Cinematic Wedding Film", "Full Candid Photo Library", "Sangeet Highlights Reel"],
      metrics: "Trending on Instagram",
      year: "2025",
      createdAt: new Date("2025-02-04").toISOString(),
    },

    // Marketing (2 projects)
    {
      id: "proj-marketing-1",
      title: "Mamaearth Monsoon Scale Campaign",
      category: "marketing",
      client: "Honasa Consumer",
      description:
        "Hyper-targeted Meta & Google ad creative variations paired with short-form shoot content that lowered CPA and maximized conversion.",
      coverImage: "/projects/proj-marketing-1.webp",
      videoPreview: "",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      featured: true,
      deliverables: ["Paid Ads (Meta & Google)", "Short-Form Creative Testing", "Content Strategy & Reach"],
      metrics: "3x More Leads",
      year: "2025",
      createdAt: new Date("2025-03-12").toISOString(),
    },
    {
      id: "proj-marketing-2",
      title: "Chaayos Omnichannel Social Growth Engine",
      category: "marketing",
      client: "Chaayos India",
      description:
        "Comprehensive social media management and high-frequency video shoots that drove foot traffic across 180+ cafes nationwide.",
      coverImage: "/projects/proj-marketing-2.webp",
      videoPreview: "",
      link: "https://www.instagram.com/insertixmedia",
      featured: false,
      deliverables: ["Social Media Management", "Reels & Reach Strategy", "Store Footfall Campaigns"],
      metrics: "+420K Reach & Growth",
      year: "2024",
      createdAt: new Date("2024-08-22").toISOString(),
    },
  ];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    p.order = i + 1;
    p.visible = true;
    await createProject(p);
  }
  console.log(`✅ Seeded ${projects.length} showcase projects.`);

  // 3. Team Members (6 members matching exact roles)
  const team: ITeamMember[] = [
    {
      id: "team-1",
      name: "Aarav Sharma",
      role: "Creative Director",
      bio: "Visionary storyteller directing commercials and high-impact brand shoots with cinematic precision.",
      avatar: "/assets/team-1.webp",
      socials: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
        twitter: "https://twitter.com",
      },
      order: 1,
    },
    {
      id: "team-2",
      name: "Kabir Mehta",
      role: "Cinematographer",
      bio: "Cinema camera specialist and lighting craftsman obsessed with anamorphic glass, contrast, and kinetic motion.",
      avatar: "/assets/team-2.webp",
      socials: {
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
      order: 2,
    },
    {
      id: "team-3",
      name: "Rhea Kapoor",
      role: "Photographer",
      bio: "Fashion and commercial portrait photographer bringing studio polish and natural light vibrancy to every frame.",
      avatar: "/assets/team-3.webp",
      socials: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
      order: 3,
    },
    {
      id: "team-4",
      name: "Vikram Malhotra",
      role: "Video Editor",
      bio: "Master of rhythmic cuts, DaVinci Resolve color grading, and immersive audio design for broadcast and short-form.",
      avatar: "/assets/team-4.webp",
      socials: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com",
      },
      order: 4,
    },
    {
      id: "team-5",
      name: "Ananya Iyer",
      role: "Marketing Lead",
      bio: "Growth strategist turning video views and photo assets into viral reach, paid performance, and loyal customers.",
      avatar: "/assets/team-5.webp",
      socials: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com",
      },
      order: 5,
    },
    {
      id: "team-6",
      name: "Rohan Sen",
      role: "Production Manager",
      bio: "Logistics powerhouse orchestrating multi-camera crew setups, location permits, and seamless shoot execution.",
      avatar: "/assets/team-6.webp",
      socials: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
      order: 6,
    },
  ];

  for (const m of team) {
    m.visible = true;
    await createTeamMember(m);
  }
  console.log(`✅ Seeded ${team.length} team members.`);

  // 4. Testimonials (4 realistic shoot & marketing endorsements)
  const testimonials: ITestimonial[] = [
    {
      id: "test-1",
      clientName: "Rohan Verma",
      company: "Zomato Dining",
      role: "Brand Marketing Lead",
      content:
        "Insertix Media handled our commercial shoot with world-class cinema gear and flawless direction. The final ad reels delivered over 4.8 million views within a week.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: "test-2",
      clientName: "Pooja Hegde",
      company: "Fabindia Textiles",
      role: "Creative Head",
      content:
        "The photoshoots exceeded every expectation. Their team captured the delicate textures of our fabrics in stunning natural light, and the collection sold out in four days.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: "test-3",
      clientName: "Aditya Roy",
      company: "boAt Lifestyle",
      role: "VP Consumer Products",
      content:
        "Their product shoot turned ordinary e-commerce listings into irresistible high-ticket showcases. We recorded a 3.4x spike in sales immediately after updating our catalogue.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: "test-4",
      clientName: "Simran Kaur",
      company: "Percept Live / Sunburn",
      role: "Festival Director",
      content:
        "From high-speed drone shots to electric aftermovies, Insertix captured the raw energy of 85,000 festivalgoers. Their turnaround time was mind-blowing.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
      rating: 5,
    },
  ];

  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    t.order = i + 1;
    t.visible = true;
    await createTestimonial(t);
  }
  console.log(`✅ Seeded ${testimonials.length} testimonials.`);

  // 5. Inquiries (3 realistic Indian inquiries)
  const inquiries: IContactMessage[] = [
    {
      id: "msg-1",
      name: "Aditi Rao",
      email: "aditi.rao@luxebrand.in",
      phone: "+919820123456",
      service: "Video Shoots",
      budget: "₹2,00,000 - ₹5,00,000",
      message: "Looking to shoot a 60s cinema ad film and 5 high-energy reels for our new ethnic apparel line in Mumbai.",
      status: "new",
      createdAt: new Date("2026-10-25T11:30:00.000Z").toISOString(),
    },
    {
      id: "msg-2",
      name: "Vikram Singhania",
      email: "vikram@urbanroots.co.in",
      phone: "+919811234567",
      service: "Product Shoot",
      budget: "₹50,000 - ₹2,00,000",
      message: "Need clean white-background and lifestyle shots for 24 skincare SKUs for our upcoming Amazon & Nykaa launch.",
      status: "new",
      createdAt: new Date("2026-10-25T09:15:00.000Z").toISOString(),
    },
    {
      id: "msg-3",
      name: "Meera Sen",
      email: "meera.sen@sunrisemedia.in",
      phone: "+919830987654",
      service: "Event Shoots",
      budget: "₹5,00,000+",
      message: "Covering our 3-day tech and creator summit in Bangalore with 4K multi-camera video, FPV drone, and daily highlight edits.",
      status: "contacted",
      createdAt: new Date("2026-10-24T14:45:00.000Z").toISOString(),
    },
  ];

  for (const inq of inquiries) {
    await createContactMessage(inq);
  }
  console.log(`✅ Seeded ${inquiries.length} contact inquiries.`);

  console.log("🚀 Seeding completed successfully!");
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seed().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
}
