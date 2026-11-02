import { supabase, BKASH_RECEIVER_NUMBER } from './supabase';
import type {
  Article, BkashOrder, CartItem, Comment, CommunityIdea, CommunityPost, LinkedInReactionType,
  NotificationItem, ReactionRecord, ReactionTargetType, ResearchPaper, StoryReel,
  StoreProduct, TopicStory, UpcomingEvent, UserProfile,
} from '../types';
import { applyReactionChange } from '../utils/pureLogic';

export type SupabaseConnectionStatus = 'checking' | 'connected' | 'schema_missing' | 'offline';

export interface DatabaseSnapshot {
  profiles: UserProfile[];
  currentUserId: string;
  articles: Article[];
  posts: CommunityPost[];
  comments: Comment[];
  reactions: ReactionRecord[];
  reels: StoryReel[];
  stories: TopicStory[];
  events: UpcomingEvent[];
  eventRegistrations: string[];
  researchPapers: ResearchPaper[];
  storeProducts: StoreProduct[];
  cart: CartItem[];
  orders: BkashOrder[];
  ideas: CommunityIdea[];
  votedIdeaIds: string[];
  bookmarkedArticleIds: string[];
  savedPostIds: string[];
  followingIds: string[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'plainsyt_clean_mirror_v7';

export const ADMIN_PROFILE: UserProfile = {
  id: 'usr-plainsyt-admin',
  name: 'PLAiNSYT',
  nameBn: 'প্লেইনসাইট',
  handle: 'plainsyt',
  role: 'Admin',
  organization: 'PLAiNSYT Editorial & Agro-Tech Publishing',
  location: 'ঢাকা, বাংলাদেশ',
  bio: 'কৃষি, প্রযুক্তি, গবেষণা ও জ্ঞানভিত্তিক বাংলাদেশের উন্মুক্ত প্রকাশনা প্ল্যাটফর্ম।',
  avatar: '/logos/icon.png',
  coverGradient: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #00ED64 100%)',
  isVerified: true,
  focusArea: 'Agro-Tech Editorial & Publishing',
  website: 'https://plainsyt.org',
  email: 'plaiinsyt@gmail.com',
  publicationsCount: 3,
  followersCount: 1420,
  followingCount: 12,
  createdAt: '2026-01-01T00:00:00Z',
};

export const ZUBAIR_PROFILE: UserProfile = {
  id: 'usr-zubair',
  name: 'Zubair Hasan',
  nameBn: 'জুবায়ের হাসান',
  handle: 'zubair',
  role: 'Research Fellow',
  organization: 'Bangladesh Agricultural University (BAU)',
  location: 'ময়মনসিংহ, বাংলাদেশ',
  bio: 'গবেষক ও এগ্রো-আইওটি ডেভেলপার। নির্ভুল তথ্যভিত্তিক কৃষি প্রযুক্তির প্রসারে নিবেদিত।',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  coverGradient: 'linear-gradient(135deg, #061621 0%, #0d2b3e 55%, #00ED64 100%)',
  isVerified: true,
  focusArea: 'Precision Ag & IoT',
  website: '',
  email: 'z65gt9@gmail.com',
  publicationsCount: 2,
  followersCount: 890,
  followingCount: 45,
  createdAt: '2026-02-15T00:00:00Z',
};

export const BINA_ARTICLE: Article = {
  id: 'art-bina-gamma-2026',
  slug: 'bina-gamma-ray-irradiation-center-inauguration-2026',
  title: 'বিনার গামা রশ্মি বিকিরণ কেন্দ্র উদ্বোধন, কৃষিপণ্যের সংরক্ষণকাল বাড়বে ১২ মাস পর্যন্ত',
  subtitle: 'বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউটের (বিনা) আঞ্চলিক গবেষণাকেন্দ্রে ৫০০ কেসিআই সক্ষমতার গামা ইরেডিয়েশন সেন্টার (জিআইসি) চালু',
  category: 'বিজ্ঞান',
  categoryEn: 'Nuclear Agriculture & Post-Harvest Technology',
  imageType: 'floating',
  coverImageUrl: 'https://media.prothomalo.com/prothomalo-bangla%2F2026-10-31%2Fos27skm2%2FBINA.jpeg?rect=1%2C0%2C1599%2C1066&w=622&auto=format%2Ccompress&fmt=avif',
  imageCaption: 'গামা ইরেডিয়েশন সেন্টার (জিআইসি) উদ্বোধন করেন কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ। শনিবার গাজীপুরের ভবানীপুরে। ছবি: বিনার সৌজন্যে।',
  authorId: 'usr-plainsyt-admin',
  author: {
    id: 'usr-plainsyt-admin',
    name: 'নিজস্ব প্রতিবেদক',
    nameBn: 'নিজস্ব প্রতিবেদক',
    designation: 'স্টাফ করেসপন্ডেন্ট · বিজ্ঞান ও প্রযুক্তি',
    organization: 'PLAiNSYT Newsroom',
    avatar: '/logos/icon.png',
    isVerified: true,
  },
  publishedAt: '০১ নভেম্বর ২০২৬, ০৩:০৭',
  createdAt: '2026-11-01T03:07:00+06:00',
  readTimeMinutes: 5,
  featured: true,
  content: [
    'কৃষিপণ্য সংরক্ষণে গামা রশ্মি বিকিরণ প্রযুক্তির ব্যবহার বাড়াতে গামা ইরেডিয়েশন সেন্টার (জিআইসি) চালু করেছে বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউটের (বিনা) আঞ্চলিক গবেষণাকেন্দ্রে। গাজীপুরের ভবানীপুরে শনিবার কেন্দ্রটির উদ্বোধন করেন কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ।',
    'বাংলাদেশ-চীন অংশীদারত্ব প্রকল্পের আওতায় নবনির্মিত কেন্দ্রটি তিন একর জমির ওপর গড়ে উঠেছে। এটির সক্ষমতা ৫০০ কেসিআই, যা কোবাল্ট-৬০-এর তেজস্ক্রিয়তা ব্যবহার করে তৈরি। সংশ্লিষ্ট গবেষক ও ব্যক্তিরা বলছেন, কৃষিপণ্যের সংরক্ষণকাল বাড়ানো, ক্ষতিকর অণুজীব ও পোকামাকড় নিয়ন্ত্রণ এবং পণ্যের গুণগত মান বজায় রাখতে কেন্দ্রটি গুরুত্বপূর্ণ ভূমিকা রাখবে।',
    'উদ্বোধনী অনুষ্ঠানে কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ বলেন, আন্তর্জাতিক মান বজায় রেখে কৃষিপণ্য রপ্তানি বাড়াতে গামা ইরেডিয়েশন সেন্টার একটি সময়োপযোগী উদ্যোগ। তাঁর মতে, এই কেন্দ্রের মাধ্যমে মৌসুমে দেশে উৎপাদিত গাজর ও ক্যাপসিকামের মতো সবজি যদি বেশি দিন সংরক্ষণ করা যায়, তাহলে তা অর্থনীতিকে সমৃদ্ধ করবে।',
    'প্রধান অতিথির বক্তব্যে মন্ত্রী আরও জানান, বৈশ্বিক বাজারে আম, কাঁঠাল ও আনারসের ব্যাপক চাহিদা রয়েছে। এই গামা রশ্মি বিকিরণ কেন্দ্রের মাধ্যমে দেশি এসব ফল আন্তর্জাতিক বাজারে রপ্তানিযোগ্য করে তোলা গেলে অনেক বৈদেশিক মুদ্রা অর্জন সম্ভব হবে।',
    'অনুষ্ঠানে স্বাগত বক্তব্য দেন ও মূল প্রবন্ধ উপস্থাপন করেন বিনার মহাপরিচালক শরিফুল হক ভুঁইয়া। তিনি জানান, ৮৯ কোটি টাকা ব্যয়ে নির্মিত এই কেন্দ্র প্রতিবছর ৫৬ হাজার ৫০০ টন পণ্যের সংগ্রহোত্তর ক্ষতি কমাবে। এর মাধ্যমে সাশ্রয় হবে কমপক্ষে ৫৩ কোটি ৭০ লাখ টাকা। তিনি আরও বলেন, গামা রশ্মি প্রয়োগের মাধ্যমে আম ও কলার ‘শেলফ লাইফ’ বা সংরক্ষণকাল ১০ থেকে ২১ দিন, পেঁয়াজ ও আলুর ছয় মাস এবং রসুনের ক্ষেত্রে ১২ মাস পর্যন্ত বাড়ানো সম্ভব।',
    'কৃষিপণ্যের পাশাপাশি মেডিক্যাল সরঞ্জাম শতভাগ জীবাণুমুক্ত করার জন্যও এই গামা রশ্মি বিকিরণ কেন্দ্র সবচেয়ে ভালো উপায় বলে উল্লেখ করেন গাজীপুর-৩ আসনের সংসদ সদস্য এসএম রফিকুল ইসলাম। তাই কেন্দ্রটিকে বহুমুখীভাবে ব্যবহারের কথা বলেন তিনি। আর কৃষি সচিব মো. সেলিম খান বলেন, এই গামা রশ্মি বিকিরণ কেন্দ্রের গবেষণা ও সেবার সঙ্গে কৃষক, কৃষক সংগঠন, কৃষিপণ্য প্রক্রিয়াজাতকারী শিল্প উদ্যোক্তা ও রপ্তানিকারক প্রতিষ্ঠানের মতো অংশীজনদের অবশ্যই সম্পৃক্ত করতে হবে।',
    'অনুষ্ঠানে আরও বক্তব্য দেন জাতিসংঘের খাদ্য ও কৃষি সংস্থার (এফএও) বাংলাদেশ প্রতিনিধি জিয়াকুন শি। বিশেষ অতিথি হিসেবে বক্তব্য দেন বাংলাদেশ আণবিক শক্তি নিয়ন্ত্রণ কর্তৃপক্ষের চেয়ারম্যান মাহমুদুল হাসান, বাংলাদেশ পরমাণু শক্তি কমিশনের চেয়ারম্যান এম মইনুল ইসলাম, চীনের সিএনএফ কোম্পানির ডিজিএম ও আন্তর্জাতিক বিষয়ক পরিচালক ঝাং শুনদে প্রমুখ। সমাপনী বক্তব্য দেন বিনার পরিচালক (প্রশাসন ও সেবা বিভাগ) এম লুৎফর রহমান মোল্লা',
  ],
  takeaways: [
    'গাজীপুরের ভবানীপুরে বিনার ৩ একর জমিতে ৫০০ কেসিআই সক্ষমতার গামা ইরেডিয়েশন সেন্টার চালু হলো।',
    'বার্ষিক ৫৬,৫০০ টন কৃষিপণ্যের সংগ্রহোত্তর ক্ষতি কমিয়ে বছরে অন্তত ৫৩ কোটি ৭০ লাখ টাকা জাতীয় সাশ্রয় হবে।',
    'আম-কলার সংরক্ষণকাল ২১ দিন, পেঁয়াজ-আলুর ৬ মাস এবং রসুনের শেলফ-লাইফ ১২ মাস পর্যন্ত বাড়বে।',
    'কৃষিপণ্য রপ্তানি বৃদ্ধির পাশাপাশি মেডিক্যাল সার্জিক্যাল সরঞ্জাম শতভাগ জীবাণুমুক্ত করতে বহুমুখী ব্যবহারের সুযোগ।',
  ],
  researchBasis: {
    journalOrInst: 'বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউট (বিনা) ও MoFL',
    doiOrSource: 'BINA Regional Research Center, Bhabanipur, Gazipur',
    keyMetric: '500 kCi Cobalt-60 Gamma Source',
  },
  stats: {
    views: 1420,
    likes: 0,
    commentsCount: 0,
    shares: 0,
  },
  reactionCounts: {},
  comments: [],
};

export const JAPAN_ROBOT_ARTICLE: Article = {
  id: 'art-japan-cucumber-robot-2026',
  slug: 'japan-ai-cucumber-harvesting-robot-future-of-smart-agriculture',
  title: 'ঘুমন্ত গ্রামের নীরব পাহারাদার: ৪০ মিনিটে ১২০টি শসা তোলা জাপানি "রোবট কৃষক" কীভাবে বদলে দিচ্ছে কৃষির ভবিষ্যৎ?',
  subtitle: 'মানুষ যখন গভীর ঘুমে আচ্ছন্ন, মাঠের পর মাঠ তখন জেগে থাকে এক নতুন যুগের কারিগর — ইয়াসকাওয়া ও জেএ জেন-নোহ’র তৈরি এআই রোবট শ্রমিক সংকট কাটিয়ে কৃষিতে আনছে ঐতিহাসিক রূপান্তর',
  category: 'এগ্রি-টেক ও ড্রোন',
  categoryEn: 'Agri-Tech & Robotics',
  imageType: 'floating',
  coverImageUrl: '/images/japan_cucumber_robot.jpg',
  imageCaption: 'জাপানের সাগা শহরের ইউমে ফার্ম জেন-নোহ গ্রিনহাউসে রাতের আঁধারে মাল্টি-ক্যামেরা সেন্সর ও এআই রোবটিক আর্মে শসা তুলছে আধুনিক রোবট কৃষক। ছবি: PLAiNSYT / জেএ জেন-নোহ সৌজন্যে।',
  authorId: 'usr-plainsyt-admin',
  author: {
    id: 'usr-plainsyt-admin',
    name: 'নিজস্ব প্রতিবেদক',
    nameBn: 'নিজস্ব প্রতিবেদক',
    designation: 'স্টাফ করেসপন্ডেন্ট · এগ্রি-টেক ও রোবোটিক্স',
    organization: 'PLAiNSYT Newsroom',
    avatar: '/logos/icon.png',
    isVerified: true,
  },
  publishedAt: '০১ নভেম্বর ২০২৬, ১৮:৫০',
  createdAt: '2026-11-01T18:50:00+06:00',
  readTimeMinutes: 6,
  featured: true,
  content: [
    'মানুষ যখন গভীর ঘুমে আচ্ছন্ন, মাঠের পর মাঠ তখন জেগে থাকে এক নতুন যুগের কারিগর। নেই কোনো ক্লান্তি, নেই পিঠব্যথার অনুযোগ, এমনকি রাতের আঁধারও যার কাছে দিনের মতোই স্পষ্ট। জাপানের সাগা শহরের \'ইউমে ফার্ম জেন-নোহ\' নামের এক হেক্টর আয়তনের একটি গ্রিনহাউসে এখন এমনই এক দৃশ্য নিয়মিত দেখা যাচ্ছে। সেখানে মানুষের বদলে কাঁধে কাঁধ মিলিয়ে—কিংবা বলা ভালো, মানুষকে ছাড়িয়ে—ফসল তোলার কাজ করছে কৃত্রিম বুদ্ধিমত্তা বা এআই-চালিত এক অদ্ভুত রোবট।',
    'ইয়াসকাওয়া ইলেকট্রিক এবং জাপানের জাতীয় কৃষি সমবায় ফেডারেশন (জেএ জেন-নোহ) যৌথভাবে তৈরি করেছে এই রোবট কৃষককে। প্রযুক্তি আর কৃষির এই মেলবন্ধন কীভাবে বিশ্বজুড়ে কৃষিকাজের সংজ্ঞা বদলে দিচ্ছে, চলুন জানা যাক তার আদ্যোপান্ত।',
    '৪০ মিনিটে ১২০টি শসা: রোবটের অবিশ্বাস্য কর্মদক্ষতা\n\nশুনতে অবিশ্বাস্য মনে হলেও, এই রোবটটি প্রতি ৪০ মিনিটে গড়ে ১২০টি শসা গাছ থেকে পেড়ে ঝুড়িতে তুলতে পারে। অর্থাৎ, প্রতিটি শসা তুলতে এর সময় লাগে মাত্র ২০ সেকেন্ডের মতো। ১ মিটার দীর্ঘ, দূর থেকে দেখতে খানিকটা শামুকের মতো আকৃতির এই রোবটটির ভেতরে রয়েছে অত্যন্ত জটিল সব প্রযুক্তি। এতে রয়েছে বিশেষ ক্যামেরা, সেন্সর, একটি রোবোটিক বাহু (যার গায়ে ইয়াসকাওয়া-র লোগো স্পষ্ট) এবং একটি স্বয়ংক্রিয় গাড়ি বা ক্যারেজ।',
    'এর কাজের প্রক্রিয়াটি দেখার মতো:\n১. চাষের সারির মধ্য দিয়ে রোবটটি ধীরে ধীরে চলতে শুরু করে।\n২. এর এআই এবং মাল্টি-ক্যামেরা সিস্টেম অনবরত চারপাশের লতা ও পাতা স্ক্যান করতে থাকে।\n৩. ঘন পাতার আড়ালে লুকিয়ে থাকা শসার আকার, পরিপক্বতা এবং রং বিশ্লেষণ করে এটি তাৎক্ষণিকভাবে সিদ্ধান্ত নেয় যে সেটি তোলার উপযোগী কি না।\n৪. উপযুক্ত শসা চিহ্নিত করার পর, এর নীল রঙের রোবোটিক হাতটি নিখুঁতভাবে এগিয়ে যায়, শসাটিকে হালকাভাবে ধরে এবং হাতের ডগায় থাকা বিশেষ ব্লেড দিয়ে বোঁটা কেটে পেছনের ঝুড়িতে জমা করে।',
    '৫ বছরের কঠোর সংগ্রাম: ১০% থেকে ৮০% সাফল্যের গল্প\n\nএই রোবটের আজকের এই সাফল্য কিন্তু রাতারাতি আসেনি। ২০২১ সালের দিকে যখন এর প্রথম প্রোটোটাইপ বা প্রাথমিক সংস্করণ তৈরি করা হয়েছিল, তখন গাছ থেকে সঠিক আকারের শসা চিনে তোলার ক্ষেত্রে এর সাফল্যের হার ছিল মাত্র ১০ শতাংশ! বেশির ভাগ সময়ই এটি পাতা বা ডালপালা কেটে ফেলত কিংবা ছোট অপুষ্ট শসা তুলে ফেলত।',
    'গ্রিনহাউসের ভেতরের পরিবেশ শিল্পকারখানার মতো নির্দিষ্ট বা নিয়মতান্ত্রিক নয়। সেখানে একেকটি শসার আকার একেক রকম, তারা প্রতিনিয়ত বাড়ছে, দিনের আলোর পরিবর্তনের সাথে সাথে পাতার ছায়া বদলাচ্ছে, আর সবচেয়ে বড় কথা—ফসলগুলো ঘন লতাপাতার আড়ালে ঢাকা থাকে। এই জটিল প্রাকৃতিক পরিবেশকে কৃত্রিম বুদ্ধিমত্তার কাছে চেনা করাটা ছিল বিজ্ঞানীদের জন্য সবচেয়ে বড় চ্যালেঞ্জ। দীর্ঘ ৫ বছরের নিরলস গবেষণা, হাজার হাজার ছবির ডাটা দিয়ে এআই-কে প্রশিক্ষণ দেওয়া এবং যান্ত্রিক ত্রুটি সংশোধনের পর অবশেষে এসেছে বড় সাফল্য। বর্তমানে এই রোবটের নিখুঁতভাবে শসা চিনে তোলার ক্ষমতা ৭০ থেকে ৮০ শতাংশে গিয়ে পৌঁছেছে, যা একে বাণিজ্যিকভাবে ব্যবহারের উপযোগী করে তুলেছে।',
    'মানুষ বনাম রোবট: গতির চেয়ে সহনশীলতা যেখানে বড় জয়\n\nঅনেকেই প্রশ্ন করতে পারেন, ২০ সেকেন্ডে ১টি শসা তোলা তো মানুষের চেয়ে খুব বেশি দ্রুত নয়। একজন দক্ষ দিনমজুর তো এর চেয়েও দ্রুত গতিতে শসা তুলতে পারেন। কথাটি আংশিক সত্য। কিন্তু এখানেই লুকিয়ে আছে মূল তফাতটি। মানুষ হয়তো ১০ সেকেন্ডে একটি শসা তুলতে পারবে, কিন্তু গ্রীষ্মকালের তপ্ত গ্রিনহাউসে, যেখানে তাপমাত্রা ৩০ ডিগ্রি সেলসিয়াস ছাড়িয়ে যায় এবং আদ্রতা থাকে দমবন্ধ করা, সেখানে কোনো মানুষ একটানা দীর্ঘ সময় সেই গতি ধরে রাখতে পারে না।',
    'তাছাড়া, শসা তোলার জন্য প্রতিনিয়ত নিচু হওয়া এবং হাত উঁচিয়ে কাজ করার ফলে শারীরিক ক্লান্তি ও পিঠব্যথার মতো সমস্যা দেখা দেয়। মানুষকে বিশ্রাম নিতে হয়, খাবারের বিরতি দিতে হয়। অন্যদিকে, এই রোবটের কোনো ক্লান্তি নেই। এটি কোনো বিরতি ছাড়াই দিন-রাত ২৪ ঘণ্টা একই গতিতে কাজ করে যেতে পারে। রাতের বেলা যখন মানুষ ঘুমায়, তখন এটি গ্রিনহাউসের অন্ধকারেও ইনফ্রারেড ও সেন্সরের সাহায্যে নিখুঁতভাবে শসা তুলতে পারে। ফলে চাষির উৎপাদনশীলতা বেড়ে যায় বহুগুণ।',
    'তীব্র শ্রমিক সংকটের এক চমৎকার সমাধান\n\nজাপানের কৃষি খাত বর্তমানে এক ভয়াবহ সংকটের মধ্য দিয়ে যাচ্ছে—সেটি হলো বার্ধক্য এবং তীব্র শ্রমিক ঘাটতি। তরুণেরা কৃষিকাজে আসতে চাচ্ছে না, ফলে মাঠের পর মাঠ ফসল তোলার মানুষ পাওয়া যাচ্ছে না। এই রোবট মূলত সেই অভাব পূরণ করতেই মাঠে নেমেছে। বিকাশকারীরা জানিয়েছেন, এই রোবটটি শুধু ফসল তোলার মধ্যেই সীমাবদ্ধ থাকবে না। ২০২৭ সালের বসন্ত নাগাদ জাপানের বিভিন্ন খামারে এটি বাণিজ্যিকভাবে ছড়িয়ে দেওয়ার পরিকল্পনা রয়েছে। সবচেয়ে দারুণ ব্যাপার হলো, রাতে এই রোবটটি অপ্রয়োজনীয় পাতা ছাঁটাই (Leaf scraping) করবে এবং দিনে ফসল তুলবে। অর্থাৎ, এটি একই সাথে খামারের প্রায় দুজন পূর্ণাঙ্গ শ্রমিকের কাজের বোঝা নিজের কাঁধে তুলে নিতে পারবে।',
    'রোবট কি তবে কৃষকের শত্রু?\n\nনতুন কোনো প্রযুক্তি এলেই মানুষের মনে প্রথম যে ভয়টি কাজ করে, তা হলো—"এটি কি আমাদের কাজ কেড়ে নেবে?" কৃষি বিশেষজ্ঞদের মতে, এই রোবট কৃষকদের প্রতিস্থাপন করার জন্য নয়, বরং তাদের টিকিয়ে রাখার জন্য তৈরি। যে কাজগুলো অত্যন্ত কষ্টসাধ্য, একঘেয়ে এবং যার জন্য মানুষ পাওয়া যায় না, সেই কাজগুলো রোবট নিজের ওপর তুলে নিচ্ছে। এতে করে কৃষকেরা ভারী শারীরিক পরিশ্রম থেকে মুক্তি পাবেন এবং তারা খামারের ব্যবস্থাপনা, বিপণন ও ব্যবসার প্রসারে অনেক বেশি সময় দিতে পারবেন।',
    'কৃষি খাতের এই রোবটিক রূপান্তর আমাদের মনে করিয়ে দেয় যে, ভবিষ্যৎ আর দূরে নয়। কৃত্রিম বুদ্ধিমত্তা আর মেকাট্রনিক্স কীভাবে মানুষের জীবনকে সহজ করতে পারে, তার এক বাস্তব ও জীবন্ত উদাহরণ এই রোবট কৃষক। হয়তো আর কয়েক বছর পর, আমাদের দেশের ফসলের মাঠেও রাতের অন্ধকারে এভাবেই নিরলস কাজ করে যাবে কোনো এআই পাহারাদার!\n\nআপনার কি মনে হয়, আমাদের দেশের মতো কৃষিপ্রধান দেশে এমন প্রযুক্তি কতটুকু কার্যকর হবে? কমেন্টে আপনার মূল্যবান ভাবনা আমাদের সাথে শেয়ার করুন।',
  ],
  takeaways: [
    'প্রতি ৪০ মিনিটে ১২০টি শসা তোলার সক্ষমতা (প্রতিটি শসায় মাত্র ২০ সেকেন্ড)।',
    '৫ বছরের নিবিড় প্রশিক্ষণে এআই ভিশন নির্ভুলতা ১০% থেকে ৮০%-এ উন্নীত।',
    'দমবন্ধ ও উত্তপ্ত গ্রিনহাউসে দিন-রাত ২৪ ঘণ্টা একটানা ক্লান্তিহীন কাজের ক্ষমতা।',
    'রাতের অন্ধকারে ইনফ্রারেড সেন্সরে শসা সংগ্রহ এবং স্বয়ংক্রিয়ভাবে পাতা ছাঁটাই (Leaf scraping)।',
    'জাপানের তীব্র বার্ধক্য ও কৃষি শ্রমিক সংকট মোকাবিলায় খামারে দুজন শ্রমিকের সমপরিমাণ দায়িত্ব পালন।',
  ],
  researchBasis: {
    journalOrInst: 'ইয়াসকাওয়া ইলেকট্রিক ও জাপান ন্যাশনাল ফেডারেশন অব এগ্রিকালচারাল কো-অপারেটিভস (জেএ জেন-নোহ)',
    doiOrSource: 'Yume Farm JA Zen-Noh, Saga Prefecture, Japan',
    keyMetric: '120 Cucumbers / 40 min (80% Precision Vision AI)',
  },
  stats: {
    views: 1840,
    likes: 0,
    commentsCount: 0,
    shares: 0,
  },
  reactionCounts: {},
  comments: [],
};

export const DEFAULT_SEED_SNAPSHOT: DatabaseSnapshot = {
  profiles: [ADMIN_PROFILE, ZUBAIR_PROFILE],
  currentUserId: '',
  articles: [
    JAPAN_ROBOT_ARTICLE,
    BINA_ARTICLE,
    {
      id: 'art-brri-dhan102-2026',
      slug: 'brri-dhan102-zinc-enriched-boro-rice-haor-revolution',
      title: 'হাওরের আগাম বন্যা ও ব্রি-১০২: জিংকসমৃদ্ধ ধানের নতুন বিপ্লব',
      subtitle: 'আগাম ঢলের আগেই ঘরে উঠছে ফসল — আর প্রতি কেজি চালে মিলছে ২৫.৫ মিলিগ্রাম জিংক। কীভাবে বদলে যাচ্ছে সুনামগঞ্জের কৃষকের হিসাব।',
      category: 'শস্য ও কৃষিবিজ্ঞান',
      categoryEn: 'Crops & Agronomy',
      imageType: 'floating',
      coverImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=675&fit=crop',
      imageCaption: 'সুনামগঞ্জের দেখার হাওরে আগাম বোরো ধান কাটা ও মাড়াইয়ের দৃশ্য।',
      authorId: 'usr-plainsyt-admin',
      author: {
        id: 'usr-plainsyt-admin',
        name: 'PLAiNSYT Research Desk',
        nameBn: 'প্লেইনসাইট গবেষণা ডেস্ক',
        designation: 'শস্যবিজ্ঞান ও পুষ্টি বিভাগ',
        organization: 'PLAiNSYT',
        avatar: '/logos/icon.png',
        isVerified: true,
      },
      publishedAt: '৩০ অক্টোবর ২০২৬, ১০:০০',
      createdAt: '2026-10-30T10:00:00+06:00',
      readTimeMinutes: 7,
      featured: false,
      content: [
        'প্রতি বছর এপ্রিলের শুরুতে মেঘালয়ের পাহাড়ি ঢল যখন হাওরে নামে, তখন সুনামগঞ্জ, নেত্রকোনা আর কিশোরগঞ্জের লাখো কৃষকের বোরো ধান থাকে মাঠে — কাটার অপেক্ষায়। মাত্র সাত থেকে দশ দিনের ব্যবধানে পুরো মৌসুমের পরিশ্রম পানির নিচে চলে যায়।',
        'বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি) উদ্ভাবিত ব্রি ধান১০২ এই সমীকরণটাই উল্টে দিচ্ছে। জাতটির জীবনকাল ১৪৮–১৫০ দিন, যা প্রচলিত ব্রি ধান২৯-এর চেয়ে প্রায় এক সপ্তাহ কম। ফলে আগাম ঢলের আগেই ফসল কাটা সম্ভব হচ্ছে।',
        'তবে আসল চমক পুষ্টিতে। ব্রি ধান১০২-এর প্রতি কেজি চালে জিংকের পরিমাণ ২৫.৫ মিলিগ্রাম — বাংলাদেশে শিশুদের খর্বাকৃতি ও রোগপ্রতিরোধ ক্ষমতা হ্রাসের অন্যতম কারণ যে জিংক ঘাটতি, তার বিরুদ্ধে এটি একটি নীরব প্রতিরোধ।',
      ],
      takeaways: [
        'জীবনকাল ১৪৮–১৫০ দিন — আগাম ঢলের আগেই কাটা সম্ভব',
        'প্রতি কেজি চালে ২৫.৫ মি.গ্রা. জিংক, শিশুপুষ্টিতে সরাসরি প্রভাব',
        'হেক্টরপ্রতি গড় ফলন ৭.৫–৮.০ টন',
      ],
      stats: { views: 1240, likes: 0, commentsCount: 0, shares: 0 },
      reactionCounts: {},
      comments: [],
    },
    {
      id: 'art-drone-sensing-2026',
      slug: 'drone-multispectral-sensing-nitrogen-optimization-dinajpur',
      title: 'মাটির পুষ্টি ও ড্রোন সেন্সিং: নাইট্রোজেনের অপচয় রোধে ১৮% সাশ্রয়',
      subtitle: 'মাল্টিস্পেকট্রাল ড্রোন দিয়ে পাতার রং পড়ে ইউরিয়া প্রয়োগ — দিনাজপুরের তিন মৌসুমের মাঠ পরীক্ষার ফলাফল।',
      category: 'এগ্রি-টেক ও ড্রোন',
      categoryEn: 'Agri-Tech & Drones',
      imageType: 'drone',
      coverImageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1200&h=675&fit=crop',
      imageCaption: 'দিনাজপুরের বিরল উপজেলায় মাল্টিস্পেকট্রাল ড্রোন সেন্সরে প্লটভিত্তিক এনডেক্সিং জরিপ।',
      authorId: 'usr-zubair',
      author: {
        id: 'usr-zubair',
        name: 'Zubair Hasan',
        nameBn: 'জুবায়ের হাসান',
        designation: 'Research Fellow',
        organization: 'BAU, ময়মনসিংহ',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        isVerified: true,
      },
      publishedAt: '২৯ অক্টোবর ২০২৬, ১৫:৪৫',
      createdAt: '2026-10-29T15:45:00+06:00',
      readTimeMinutes: 6,
      featured: false,
      content: [
        'বাংলাদেশের কৃষক গড়ে প্রয়োজনের চেয়ে ২০–৩০ শতাংশ বেশি ইউরিয়া প্রয়োগ করেন। এর একটি বড় অংশ গ্যাস হয়ে বাতাসে মেশে বা চুইয়ে ভূগর্ভস্থ পানিতে যায়।',
        'দিনাজপুরের বিরল উপজেলায় তিন মৌসুম ধরে চালানো পরীক্ষায় মাল্টিস্পেকট্রাল ড্রোন দিয়ে NDVI ও NDRE সূচক মেপে প্লটভিত্তিক ইউরিয়া প্রয়োগ করা হয়েছে। ফলাফল: ফলন অপরিবর্তিত রেখে নাইট্রোজেন ব্যবহার কমেছে ১৮ শতাংশ।',
        'একটি ড্রোন দিনে ৪০ হেক্টর পর্যন্ত জরিপ করতে পারে। সেবা-ভিত্তিক মডেলে বিঘাপ্রতি খরচ পড়ছে ১২০ টাকা — যা সাশ্রয় হওয়া সারের দামের চেয়ে অনেক কম।',
      ],
      takeaways: [
        'ইউরিয়া ব্যবহার ১৮% কম, ফলন অপরিবর্তিত',
        'বিঘাপ্রতি জরিপ খরচ মাত্র ১২০ টাকা',
        'লিফ কালার চার্টের সাথে ৯২% মিল',
      ],
      stats: { views: 980, likes: 0, commentsCount: 0, shares: 0 },
      reactionCounts: {},
      comments: [],
    },
    {
      id: 'art-solar-cold-room-2026',
      slug: 'solar-cold-storage-onion-farmers-pabna-revolution',
      title: 'সৌরচালিত কোল্ড চেম্বার: পাবনার পেঁয়াজ চাষিদের বিপ্লব',
      subtitle: 'গ্রিডবিহীন এলাকায় কম খরচে বাষ্পীভবন শীতলীকরণ চেম্বারে পেঁয়াজ ও সবজি সংরক্ষণ।',
      category: 'খাদ্য ও কোল্ড চেইন',
      categoryEn: 'Food Cold Chain',
      imageType: 'solar',
      coverImageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&h=675&fit=crop',
      imageCaption: 'পাবনার সাঁথিয়া উপজেলায় সৌরচালিত বাষ্পীভবন কোল্ড চেম্বারে সংরক্ষিত গ্রীষ্মকালীন পেঁয়াজ।',
      authorId: 'usr-plainsyt-admin',
      author: {
        id: 'usr-plainsyt-admin',
        name: 'PLAiNSYT Research',
        nameBn: 'প্লেইনসাইট রিসার্চ',
        designation: 'পোস্ট-হারভেস্ট গবেষক দল',
        organization: 'PLAiNSYT',
        avatar: '/logos/icon.png',
        isVerified: true,
      },
      publishedAt: '২৮ অক্টোবর ২০২৬, ০৯:২০',
      createdAt: '2026-10-28T09:20:00+06:00',
      readTimeMinutes: 5,
      featured: false,
      content: [
        'দেশে প্রতিবছর উৎপাদিত পেঁয়াজের প্রায় ৩০ শতাংশই সংগ্রহোত্তর পচনে নষ্ট হয়ে যায়। পাবনা ও ফরিদপুরের কৃষকেরা উপযুক্ত বিদ্যুৎ সুবিধার অভাবে সাধারণ গুদামে পেঁয়াজ রাখতে বাধ্য হন।',
        'সৌরচালিত বাষ্পীভবন কুলিং চেম্বারে তাপমাত্রা ১৬-১৮ ডিগ্রি সেলসিয়াস এবং আর্দ্রতা ৬৫-৭০ শতাংশে নিয়ন্ত্রিত রাখা হয়। এতে ৬ মাস পর্যন্ত পেঁয়াজের কোনো অঙ্কুরোদগম বা ওজন হ্রাস ঘটে না।',
      ],
      takeaways: [
        'সংগ্রহোত্তর ক্ষতি ৩৫% থেকে কমে মাত্র ৮%',
        'বিদ্যুৎ গ্রিড ছাড়াই সম্পূর্ণ সৌরশক্তিতে পরিচালিত',
        'স্থানীয় কৃষকদের সমবায় ভিত্তিক বিনিয়োগ মডেল',
      ],
      stats: { views: 820, likes: 0, commentsCount: 0, shares: 0 },
      reactionCounts: {},
      comments: [],
    },
    {
      id: 'art-coastal-aquaculture-2026',
      slug: 'coastal-salinity-integrated-crab-tilapia-aquaculture',
      title: 'লবণাক্ত উপকূলে কাঁকড়া ও তেলাপিয়া সমন্বিত চাষ',
      subtitle: 'জলবায়ু পরিবর্তনের কারণে সৃষ্ট লবণাক্ততা কীভাবে বিকল্প লাভজনক মৎস্য চাষে রূপান্তরিত হচ্ছে।',
      category: 'মৎস্য ও প্রাণিসম্পদ',
      categoryEn: 'Fisheries & Aquaculture',
      imageType: 'fisheries',
      coverImageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=675&fit=crop',
      imageCaption: 'সাতক্ষীরার শ্যামনগরে লবণাক্ত ঘেরে পরিবেশবান্ধব নরম খোলসের কাঁকড়া ও তেলাপিয়া চাষ।',
      authorId: 'usr-plainsyt-admin',
      author: {
        id: 'usr-plainsyt-admin',
        name: 'নিজস্ব প্রতিবেদক',
        nameBn: 'নিজস্ব প্রতিবেদক',
        designation: 'উপকূলীয় পরিবেশ ডেস্ক',
        organization: 'PLAiNSYT',
        avatar: '/logos/icon.png',
        isVerified: true,
      },
      publishedAt: '২৭ অক্টোবর ২০২৬, ১১:৪০',
      createdAt: '2026-10-27T11:40:00+06:00',
      readTimeMinutes: 6,
      featured: false,
      content: [
        'দক্ষিণ-পশ্চিমাঞ্চলের সাতক্ষীরা ও খুলনার বিস্তীর্ণ জমিতে নদীর পানি প্রবেশের ফলে লবণাক্ততা আশঙ্কাজনকভাবে বেড়েছে। প্রচলিত আমন ধান চাষ সেখানে প্রায় অসম্ভব হয়ে পড়েছে।',
        'শেরেবাংলা কৃষি বিশ্ববিদ্যালয় ও স্থানীয় চাষিদের উদ্যোগে লবণাক্ত ঘেরে কাঁকড়া ও লবণ-সহনশীল তেলাপিয়া মাছের মিশ্র চাষ শুরু হয়েছে। কাঁকড়ার উচ্ছিষ্ট খাদ্য ও মল মাছের প্রাকৃতিক খাদ্য তৈরি করে, যা পানির গুণগত মান রক্ষা করে।',
      ],
      takeaways: [
        'হেক্টরপ্রতি নিট আয় সাধারণ চাষের চেয়ে প্রায় দ্বিগুণ',
        'মাটির লবণাক্ততাকে সংকট না ভেবে সম্পদে রূপান্তর',
        'আমেরিকান ও ইউরোপীয় বাজারে নরম খোলস কাঁকড়ার বিপুল চাহিদা',
      ],
      stats: { views: 760, likes: 0, commentsCount: 0, shares: 0 },
      reactionCounts: {},
      comments: [],
    },
  ],
  posts: [],
  comments: [],
  reactions: [],
  reels: [],
  stories: [],
  events: [],
  eventRegistrations: [],
  researchPapers: [],
  storeProducts: [],
  cart: [],
  orders: [],
  ideas: [],
  votedIdeaIds: [],
  bookmarkedArticleIds: [],
  savedPostIds: [],
  followingIds: [],
  notifications: [
    {
      id: 'notif-alert-1',
      recipientId: 'usr-plainsyt-admin',
      userId: 'usr-plainsyt-admin',
      actorId: 'usr-system',
      actorName: 'BRRI Research Alert',
      actorAvatar: '/logos/icon.png',
      type: 'system',
      entityType: 'article',
      entityId: 'art-bina-gamma-2026',
      targetUrl: '/article/art-bina-gamma-2026',
      targetRoute: '/article/art-bina-gamma-2026',
      message: 'গাজীপুরের ভবানীপুরে বিনার ৫০০ কেসিআই গামা ইরেডিয়েশন সেন্টার চালু হয়েছে।',
      title: 'জাতীয় গবেষণা সতর্কতা',
      source: 'PLAiNSYT Newsroom',
      time: 'আজ সকালে',
      isRead: false,
      unread: true,
      createdAt: '2026-11-01T08:00:00+06:00',
    },
  ],
};

let memoryCache: DatabaseSnapshot | null = null;

export function readSnapshot(): DatabaseSnapshot {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DatabaseSnapshot>;
      const existingArticles = (parsed.articles ?? []).filter(
        (a) => a.id !== 'art-floating-hydroponics-2026',
      );
      const mergedArticles = [...existingArticles];
      for (const sa of DEFAULT_SEED_SNAPSHOT.articles) {
        if (!mergedArticles.some((a) => a.id === sa.id)) {
          mergedArticles.unshift(sa);
        }
      }
      // Purge removed seed items from browser cache
      const cleanPosts = (parsed.posts ?? []).filter((p) => p.id !== 'post-zubair-1');
      const cleanEvents = (parsed.events ?? []).filter(
        (e) => e.id !== 'ev-summit-2026' && e.id !== 'ev-workshop-iot',
      );
      const cleanStories = (parsed.stories ?? []).filter(
        (s) => s.id !== 'story-bina-1' && s.id !== 'story-bau-iot',
      );
      memoryCache = {
        ...DEFAULT_SEED_SNAPSHOT,
        ...parsed,
        articles: mergedArticles,
        posts: cleanPosts,
        events: cleanEvents,
        stories: cleanStories,
      };
      return memoryCache;
    }
  } catch {
    // ignore storage errors
  }
  memoryCache = { ...DEFAULT_SEED_SNAPSHOT };
  return memoryCache;
}

export function writeSnapshot(next: DatabaseSnapshot): DatabaseSnapshot {
  memoryCache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

// Row mappers between camelCase TypeScript models and snake_case Postgres columns
const toProfileRow = (p: UserProfile) => ({
  id: p.id,
  name: p.name,
  name_bn: p.nameBn || p.name,
  handle: p.handle,
  role: p.role,
  organization: p.organization,
  location: p.location,
  bio: p.bio,
  avatar: p.avatar,
  cover_gradient: p.coverGradient,
  is_verified: p.isVerified,
  focus_area: p.focusArea,
  website: p.website ?? '',
  email: p.email ?? '',
  publications_count: p.publicationsCount,
  followers_count: p.followersCount,
  following_count: p.followingCount,
  created_at: p.createdAt,
});

const fromProfileRow = (r: Record<string, unknown>): UserProfile => ({
  id: String(r.id),
  name: String(r.name ?? ''),
  nameBn: String(r.name_bn ?? r.name ?? ''),
  handle: String(r.handle ?? ''),
  role: String(r.role ?? ''),
  organization: String(r.organization ?? ''),
  location: String(r.location ?? ''),
  bio: String(r.bio ?? ''),
  avatar: String(r.avatar ?? ''),
  coverGradient: String(r.cover_gradient ?? 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)'),
  isVerified: Boolean(r.is_verified),
  focusArea: String(r.focus_area ?? ''),
  website: r.website ? String(r.website) : undefined,
  email: r.email ? String(r.email) : undefined,
  publicationsCount: Number(r.publications_count ?? 0),
  followersCount: Number(r.followers_count ?? 0),
  followingCount: Number(r.following_count ?? 0),
  createdAt: String(r.created_at ?? new Date().toISOString()),
});

const toArticleRow = (a: Article) => ({
  id: a.id,
  title: a.title,
  subtitle: a.subtitle,
  slug: a.slug ?? a.id,
  category: a.category,
  category_en: a.categoryEn,
  image_type: a.imageType,
  cover_image_url: a.coverImageUrl ?? '',
  image_caption: a.imageCaption ?? '',
  author_id: a.authorId,
  author_json: a.author,
  published_at: a.publishedAt,
  read_time_minutes: a.readTimeMinutes,
  featured: Boolean(a.featured),
  content: a.content,
  takeaways: a.takeaways,
  external_link: a.externalLink ?? '',
  research_basis: a.researchBasis ?? null,
  stats: a.stats,
  reaction_counts: a.reactionCounts ?? {},
  created_at: a.createdAt ?? new Date().toISOString(),
});

const fromArticleRow = (r: Record<string, unknown>, comments: Comment[], reactions: ReactionRecord[], currentUserId: string): Article => {
  const id = String(r.id);
  const artComments = comments.filter((c) => c.targetType === 'article' && c.targetId === id);
  const artReacts = reactions.filter((rx) => rx.targetType === 'article' && rx.targetId === id);
  const counts = { ...((r.reaction_counts as Record<string, number>) ?? {}) };
  for (const rx of artReacts) {
    counts[rx.type] = Math.max(counts[rx.type] || 0, artReacts.filter((x) => x.type === rx.type).length);
  }
  const userRx = artReacts.find((rx) => rx.userId === currentUserId)?.type ?? null;
  const rawStats = (r.stats as Article['stats']) ?? { views: 0, likes: 0, commentsCount: 0, shares: 0 };
  const totalRx = Object.values(counts).reduce((s, v) => s + (v || 0), 0);
  const authorObj = (r.author_json as Article['author']) ?? { name: 'Author', designation: '', organization: '', avatar: 'AU' };
  return {
    id,
    slug: r.slug ? String(r.slug) : id,
    title: String(r.title ?? ''),
    subtitle: String(r.subtitle ?? ''),
    category: (r.category as Article['category']) ?? 'সকল',
    categoryEn: String(r.category_en ?? ''),
    imageType: (r.image_type as Article['imageType']) ?? 'floating',
    coverImageUrl: r.cover_image_url ? String(r.cover_image_url) : undefined,
    imageCaption: r.image_caption ? String(r.image_caption) : undefined,
    authorId: String(r.author_id ?? authorObj.id ?? ''),
    author: { ...authorObj, id: String(r.author_id ?? authorObj.id ?? '') },
    publishedAt: String(r.published_at ?? ''),
    createdAt: String(r.created_at ?? ''),
    readTimeMinutes: Number(r.read_time_minutes ?? 5),
    featured: Boolean(r.featured),
    content: Array.isArray(r.content) ? (r.content as string[]) : [],
    takeaways: Array.isArray(r.takeaways) ? (r.takeaways as string[]) : [],
    externalLink: r.external_link ? String(r.external_link) : undefined,
    researchBasis: (r.research_basis as Article['researchBasis']) ?? undefined,
    stats: {
      views: Number(rawStats.views ?? 0),
      likes: totalRx,
      commentsCount: artComments.length,
      shares: Number(rawStats.shares ?? 0),
    },
    reactionCounts: counts,
    userReaction: userRx,
    userLiked: !!userRx,
    comments: artComments,
  };
};

const toPostRow = (p: CommunityPost) => ({
  id: p.id,
  author_id: p.authorId,
  author_json: p.author,
  timestamp_label: p.timestamp,
  content: p.content,
  images: p.images ?? [],
  external_link: p.externalLink ?? '',
  shared_post: p.sharedPost ?? null,
  stats: p.stats,
  reaction_counts: p.reactionCounts ?? {},
  text_theme: p.textTheme ?? '',
  ai_label: Boolean(p.aiLabel),
  created_at: p.createdAt ?? new Date().toISOString(),
});

const fromPostRow = (r: Record<string, unknown>, comments: Comment[], reactions: ReactionRecord[], currentUserId: string): CommunityPost => {
  const id = String(r.id);
  const postComments = comments.filter((c) => c.targetType === 'post' && c.targetId === id);
  const postReacts = reactions.filter((rx) => rx.targetType === 'post' && rx.targetId === id);
  const counts = { ...((r.reaction_counts as Record<string, number>) ?? {}) };
  for (const rx of postReacts) {
    counts[rx.type] = Math.max(counts[rx.type] || 0, postReacts.filter((x) => x.type === rx.type).length);
  }
  const userRx = postReacts.find((rx) => rx.userId === currentUserId)?.type ?? null;
  const rawStats = (r.stats as CommunityPost['stats']) ?? { likes: 0, commentsCount: 0, shares: 0 };
  const totalRx = Object.values(counts).reduce((s, v) => s + (v || 0), 0);
  const authorObj = (r.author_json as CommunityPost['author']) ?? { name: 'Author', avatar: 'AU', role: '' };
  return {
    id,
    authorId: String(r.author_id ?? authorObj.id ?? ''),
    author: { ...authorObj, id: String(r.author_id ?? authorObj.id ?? '') },
    timestamp: String(r.timestamp_label ?? ''),
    createdAt: String(r.created_at ?? ''),
    content: String(r.content ?? ''),
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    externalLink: r.external_link ? String(r.external_link) : undefined,
    sharedPost: (r.shared_post as CommunityPost['sharedPost']) ?? undefined,
    stats: {
      likes: totalRx,
      commentsCount: postComments.length,
      shares: Number(rawStats.shares ?? 0),
    },
    reactionCounts: counts,
    userReaction: userRx,
    userLiked: !!userRx,
    comments: postComments,
    textTheme: r.text_theme ? String(r.text_theme) : undefined,
    aiLabel: Boolean(r.ai_label),
  };
};

// Synchronize snapshot to Supabase tables when schema is ready
export async function syncLocalToSupabase(snap: DatabaseSnapshot): Promise<{ ok: boolean; error?: string }> {
  try {
    if (snap.profiles.length > 0) {
      const { error } = await supabase.from('profiles').upsert(snap.profiles.map(toProfileRow));
      if (error) return { ok: false, error: error.message };
    }
    if (snap.articles.length > 0) {
      await supabase.from('articles').upsert(snap.articles.map(toArticleRow));
    }
    if (snap.posts.length > 0) {
      await supabase.from('posts').upsert(snap.posts.map(toPostRow));
    }
    if (snap.comments.length > 0) {
      await supabase.from('comments').upsert(
        snap.comments.map((c) => ({
          id: c.id,
          target_type: c.targetType ?? 'article',
          target_id: c.targetId ?? '',
          author_id: c.authorId,
          author: c.author,
          avatar: c.avatar,
          role: c.role,
          text: c.text,
          timestamp_label: c.timestamp,
          likes: c.likes,
          reaction_counts: c.reactionCounts ?? {},
        })),
      );
    }
    if (snap.reactions.length > 0) {
      await supabase.from('reactions').upsert(
        snap.reactions.map((rx) => ({
          id: rx.id,
          target_type: rx.targetType,
          target_id: rx.targetId,
          user_id: rx.userId,
          user_name: rx.userName,
          user_avatar: rx.userAvatar,
          user_role: rx.userRole,
          type: rx.type,
          created_at: rx.createdAt,
        })),
        { onConflict: 'target_type,target_id,user_id' },
      );
    }
    if (snap.storeProducts.length > 0) {
      await supabase.from('store_products').upsert(
        snap.storeProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          unit: p.unit,
          tag: p.tag,
          image: p.image,
          seller_id: p.sellerId,
          seller: p.seller,
          stock: p.stock,
          created_at: p.createdAt,
        })),
      );
    }
    if (snap.orders.length > 0) {
      await supabase.from('orders').upsert(
        snap.orders.map((o) => ({
          id: o.id,
          order_number: o.orderNumber,
          buyer_id: o.buyerId,
          buyer_name: o.buyerName,
          buyer_phone: o.buyerPhone,
          district: o.district,
          delivery_address: o.deliveryAddress,
          delivery_zone: o.deliveryZone,
          notes: o.notes ?? '',
          items: o.items,
          subtotal_bdt: o.subtotalBdt,
          delivery_fee_bdt: o.deliveryFeeBdt,
          total_bdt: o.totalBdt,
          receiver_bkash: BKASH_RECEIVER_NUMBER,
          sender_bkash: o.senderBkash,
          trx_id: o.trxId,
          payment_method: o.paymentMethod,
          payment_screenshot: o.paymentScreenshot ?? '',
          status: o.status,
          created_at: o.createdAt,
        })),
      );
    }
    if (snap.events.length > 0) {
      await supabase.from('events').upsert(
        snap.events.map((e) => ({
          id: e.id,
          title: e.title,
          date_month: e.dateMonth,
          date_day: e.dateDay,
          location: e.location,
          attendees_count: e.attendeesCount,
          organizer_id: e.organizerId ?? '',
          organizer_name: e.organizerName ?? '',
          description: e.description ?? '',
          external_link: e.externalLink ?? '',
        })),
      );
    }
    if (snap.reels.length > 0) {
      await supabase.from('reels').upsert(
        snap.reels.map((r) => ({
          id: r.id,
          title: r.title,
          creator_id: r.creatorId,
          creator: r.creator,
          creator_avatar: r.creatorAvatar,
          location: r.location,
          duration: r.duration,
          views: r.views,
          gradient_theme: r.gradientTheme,
          video_type: r.videoType,
          media_url: r.mediaUrl,
          video_url: r.videoUrl ?? '',
          likes: r.likes,
          reaction_counts: r.reactionCounts ?? {},
        })),
      );
    }
    if (snap.stories.length > 0) {
      await supabase.from('stories').upsert(
        snap.stories.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          image_url: s.imageUrl,
          icon_name: s.iconName,
          reads_count: s.readsCount ?? '0',
          author_id: s.authorId ?? '',
          author_name: s.authorName ?? '',
          author_avatar: s.authorAvatar ?? '',
          article_id: s.articleId ?? null,
        })),
      );
    }
    if (snap.researchPapers.length > 0) {
      await supabase.from('research_papers').upsert(
        snap.researchPapers.map((rp) => ({
          id: rp.id,
          institution: rp.institution,
          institution_code: rp.institutionCode,
          title: rp.title,
          summary: rp.summary,
          practical_impact: rp.practicalImpact,
          published_date: rp.publishedDate,
          researchers: rp.researchers,
          author_id: rp.authorId ?? '',
          doi_link: rp.doiLink ?? '',
        })),
      );
    }
    if (snap.ideas.length > 0) {
      await supabase.from('ideas').upsert(
        snap.ideas.map((i) => ({
          id: i.id,
          title: i.title,
          body: i.body,
          author_id: i.authorId,
          author: i.author,
          author_avatar: i.authorAvatar ?? '',
          votes: i.votes,
          tag: i.tag,
          created_at: i.createdAt,
        })),
      );
    }
    if (snap.notifications.length > 0) {
      await supabase.from('notifications').upsert(
        snap.notifications.map((n) => ({
          id: n.id,
          recipient_id: n.recipientId ?? n.userId ?? '',
          actor_id: n.actorId ?? '',
          actor_name: n.actorName ?? '',
          actor_avatar: n.actorAvatar ?? '',
          type: n.type ?? 'system',
          entity_type: n.entityType ?? 'article',
          entity_id: n.entityId ?? '',
          target_url: n.targetUrl ?? n.targetRoute ?? '/',
          message: n.message || n.title,
          is_read: Boolean(n.isRead !== undefined ? n.isRead : !n.unread),
          created_at: n.createdAt ?? new Date().toISOString(),
        })),
      );
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Fetch all live data from Supabase with resilient fallbacks
export async function fetchFromSupabase(limit = 60): Promise<{
  status: SupabaseConnectionStatus;
  snapshot?: DatabaseSnapshot;
  errorMessage?: string;
}> {
  const local = readSnapshot();
  try {
    const probe = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).range(0, limit - 1);
    if (probe.error) {
      if (probe.error.code === 'PGRST205' || probe.error.message?.includes('schema cache')) {
        return { status: 'schema_missing', snapshot: local, errorMessage: probe.error.message };
      }
      return { status: 'offline', snapshot: local, errorMessage: probe.error.message };
    }

    // Parallel indexed queries across all tables
    const [
      articlesRes,
      postsRes,
      commentsRes,
      reactionsRes,
      reelsRes,
      storiesRes,
      eventsRes,
      papersRes,
      productsRes,
      ordersRes,
      ideasRes,
      notifsRes,
    ] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }).range(0, limit - 1),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).range(0, limit - 1),
      supabase.from('comments').select('*').order('created_at', { ascending: false }).range(0, 200),
      supabase.from('reactions').select('*').order('created_at', { ascending: false }).range(0, 500),
      supabase.from('reels').select('*').order('created_at', { ascending: false }).range(0, 30),
      supabase.from('stories').select('*').order('created_at', { ascending: false }).range(0, 30),
      supabase.from('events').select('*').order('created_at', { ascending: false }).range(0, 30),
      supabase.from('research_papers').select('*').order('created_at', { ascending: false }).range(0, 30),
      supabase.from('store_products').select('*').order('created_at', { ascending: false }).range(0, 60),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).range(0, 50),
      supabase.from('ideas').select('*').order('votes', { ascending: false }).range(0, 50),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).range(0, 30),
    ]);

    const profiles = (probe.data ?? []).map((r) => fromProfileRow(r as Record<string, unknown>));
    const currentUserId = local.currentUserId && profiles.some((p) => p.id === local.currentUserId)
      ? local.currentUserId
      : '';

    const comments: Comment[] = (commentsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      targetType: (r.target_type as Comment['targetType']) ?? 'article',
      targetId: String(r.target_id ?? ''),
      authorId: String(r.author_id ?? ''),
      author: String(r.author ?? ''),
      avatar: String(r.avatar ?? ''),
      role: String(r.role ?? ''),
      text: String(r.text ?? ''),
      timestamp: String(r.timestamp_label ?? ''),
      likes: Number(r.likes ?? 0),
      reactionCounts: (r.reaction_counts as Comment['reactionCounts']) ?? {},
    }));

    const reactions: ReactionRecord[] = (reactionsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      targetType: (r.target_type as ReactionTargetType) ?? 'article',
      targetId: String(r.target_id ?? ''),
      userId: String(r.user_id ?? ''),
      userName: String(r.user_name ?? ''),
      userAvatar: String(r.user_avatar ?? ''),
      userRole: String(r.user_role ?? ''),
      type: (r.type as LinkedInReactionType) ?? 'like',
      createdAt: String(r.created_at ?? ''),
    }));

    const articles = (articlesRes.data ?? []).map((r) =>
      fromArticleRow(r as Record<string, unknown>, comments, reactions, currentUserId),
    );
    const posts = (postsRes.data ?? []).map((r) =>
      fromPostRow(r as Record<string, unknown>, comments, reactions, currentUserId),
    );
    const reels: StoryReel[] = (reelsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      creatorId: String(r.creator_id ?? ''),
      creator: String(r.creator ?? ''),
      creatorAvatar: String(r.creator_avatar ?? ''),
      location: String(r.location ?? ''),
      duration: String(r.duration ?? '1:00'),
      views: Number(r.views ?? 0),
      gradientTheme: String(r.gradient_theme ?? 'from-emerald-900 to-lime-700'),
      videoType: (r.video_type as StoryReel['videoType']) ?? 'greenhouse-iot',
      mediaUrl: String(r.media_url ?? ''),
      videoUrl: r.video_url ? String(r.video_url) : undefined,
      likes: Number(r.likes ?? 0),
      reactionCounts: (r.reaction_counts as StoryReel['reactionCounts']) ?? {},
      createdAt: String(r.created_at ?? ''),
    }));
    const stories: TopicStory[] = (storiesRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      category: (r.category as TopicStory['category']) ?? 'সকল',
      imageUrl: String(r.image_url ?? ''),
      iconName: (r.icon_name as TopicStory['iconName']) ?? 'seedling',
      readsCount: String(r.reads_count ?? '0'),
      authorId: String(r.author_id ?? ''),
      authorName: String(r.author_name ?? ''),
      authorAvatar: String(r.author_avatar ?? ''),
      articleId: r.article_id ? String(r.article_id) : undefined,
    }));
    const events: UpcomingEvent[] = (eventsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      dateMonth: String(r.date_month ?? 'JAN'),
      dateDay: String(r.date_day ?? '01'),
      location: String(r.location ?? ''),
      attendeesCount: String(r.attendees_count ?? '0'),
      organizerId: String(r.organizer_id ?? ''),
      organizerName: String(r.organizer_name ?? ''),
      description: String(r.description ?? ''),
      externalLink: String(r.external_link ?? ''),
      isRegistered: local.eventRegistrations.includes(String(r.id)),
    }));
    const researchPapers: ResearchPaper[] = (papersRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      institution: String(r.institution ?? ''),
      institutionCode: (r.institution_code as ResearchPaper['institutionCode']) ?? 'BRRI',
      title: String(r.title ?? ''),
      summary: String(r.summary ?? ''),
      practicalImpact: String(r.practical_impact ?? ''),
      publishedDate: String(r.published_date ?? ''),
      researchers: Array.isArray(r.researchers) ? (r.researchers as string[]) : [],
      authorId: String(r.author_id ?? ''),
      doiLink: String(r.doi_link ?? ''),
    }));
    const storeProducts: StoreProduct[] = (productsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      description: String(r.description ?? ''),
      price: Number(r.price ?? 0),
      unit: String(r.unit ?? 'পিস'),
      tag: String(r.tag ?? 'Agri-Tech'),
      image: String(r.image ?? ''),
      sellerId: String(r.seller_id ?? ''),
      seller: String(r.seller ?? ''),
      stock: Number(r.stock ?? 0),
      createdAt: String(r.created_at ?? ''),
    }));
    const orders: BkashOrder[] = (ordersRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      orderNumber: String(r.order_number ?? ''),
      buyerId: String(r.buyer_id ?? ''),
      buyerName: String(r.buyer_name ?? ''),
      buyerPhone: String(r.buyer_phone ?? ''),
      district: String(r.district ?? ''),
      deliveryAddress: String(r.delivery_address ?? ''),
      deliveryZone: (r.delivery_zone as BkashOrder['deliveryZone']) ?? 'inside_dhaka',
      notes: String(r.notes ?? ''),
      items: Array.isArray(r.items) ? (r.items as BkashOrder['items']) : [],
      subtotalBdt: Number(r.subtotal_bdt ?? 0),
      deliveryFeeBdt: Number(r.delivery_fee_bdt ?? 0),
      totalBdt: Number(r.total_bdt ?? 0),
      receiverBkash: BKASH_RECEIVER_NUMBER,
      senderBkash: String(r.sender_bkash ?? ''),
      trxId: String(r.trx_id ?? ''),
      paymentMethod: (r.payment_method as BkashOrder['paymentMethod']) ?? 'bkash_send_money',
      paymentScreenshot: r.payment_screenshot ? String(r.payment_screenshot) : undefined,
      status: (r.status as BkashOrder['status']) ?? 'paid_verifying',
      createdAt: String(r.created_at ?? ''),
    }));
    const ideas: CommunityIdea[] = (ideasRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      body: String(r.body ?? ''),
      authorId: String(r.author_id ?? ''),
      author: String(r.author ?? ''),
      authorAvatar: String(r.author_avatar ?? ''),
      votes: Number(r.votes ?? 1),
      tag: String(r.tag ?? 'এগ্রি-টেক'),
      voted: local.votedIdeaIds.includes(String(r.id)),
      createdAt: String(r.created_at ?? ''),
    }));
    const notifications: NotificationItem[] = (notifsRes.data ?? []).map((r: Record<string, unknown>) => {
      const recipientId = String(r.recipient_id ?? r.user_id ?? '');
      const actorName = String(r.actor_name ?? r.source ?? 'সদস্য');
      const message = String(r.message ?? r.title ?? '');
      const isRead = Boolean(r.is_read !== undefined ? r.is_read : !r.unread);
      return {
        id: String(r.id),
        userId: recipientId,
        recipientId,
        actorId: String(r.actor_id ?? ''),
        actorName,
        actorAvatar: String(r.actor_avatar ?? ''),
        type: (r.type as NotificationItem['type']) ?? 'system',
        entityType: (r.entity_type as NotificationItem['entityType']) ?? 'article',
        entityId: String(r.entity_id ?? ''),
        targetUrl: String(r.target_url ?? r.target_route ?? '/'),
        message,
        isRead,
        title: message,
        source: actorName,
        time: String(r.time_label ?? (r.created_at ? new Date(String(r.created_at)).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'এখন')),
        unread: !isRead,
        targetRoute: String(r.target_url ?? r.target_route ?? '/'),
        createdAt: String(r.created_at ?? ''),
      };
    });

    // If remote tables are empty but local has seed items, automatically populate remote
    if (
      profiles.length === 0 &&
      articles.length === 0 &&
      (local.profiles.length > 0 || local.articles.length > 0 || local.storeProducts.length > 0)
    ) {
      await syncLocalToSupabase(local);
      return { status: 'connected', snapshot: local };
    }

    // Merge remote articles with seed and local articles so newly added articles in code
    // never get wiped out if remote database is only partially populated
    const remoteArticleIds = new Set(articles.map((a) => a.id));
    const localOnlyArticles = (local.articles || []).filter((a) => !remoteArticleIds.has(a.id));
    const seedOnlyArticles = DEFAULT_SEED_SNAPSHOT.articles.filter(
      (sa) => !remoteArticleIds.has(sa.id) && !localOnlyArticles.some((a) => a.id === sa.id),
    );
    const finalArticles = [...seedOnlyArticles, ...articles, ...localOnlyArticles].filter(
      (a) => a.id !== 'art-floating-hydroponics-2026',
    );
    const finalPosts = (posts.length > 0 ? posts : local.posts).filter((p) => p.id !== 'post-zubair-1');

    // Filter out removed events and stories
    const cleanEvents = (events.length > 0 ? events : local.events).filter(
      (e) => e.id !== 'ev-summit-2026' && e.id !== 'ev-workshop-iot',
    );
    const cleanStories = (stories.length > 0 ? stories : local.stories).filter(
      (s) => s.id !== 'story-bina-1' && s.id !== 'story-bau-iot',
    );

    let userFollows = local.followingIds || [];
    if (currentUserId) {
      try {
        const followsRes = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId);
        if (followsRes.data && followsRes.data.length > 0) {
          const remoteFollows = followsRes.data.map((r: Record<string, unknown>) => String(r.following_id));
          userFollows = Array.from(new Set([...userFollows, ...remoteFollows]));
        }
      } catch {
        // non-blocking
      }
    }

    const merged: DatabaseSnapshot = {
      ...local,
      profiles: profiles.length > 0 ? profiles : local.profiles,
      currentUserId: currentUserId || local.currentUserId,
      followingIds: userFollows,
      articles: finalArticles.length > 0 ? finalArticles : DEFAULT_SEED_SNAPSHOT.articles,
      posts: finalPosts,
      comments: commentsRes.data !== null && commentsRes.data !== undefined ? comments : local.comments,
      reactions: reactionsRes.data !== null && reactionsRes.data !== undefined ? reactions : local.reactions,
      reels: reels.length > 0 ? reels : local.reels,
      stories: cleanStories,
      events: cleanEvents,
      researchPapers: researchPapers.length > 0 ? researchPapers : local.researchPapers,
      storeProducts: storeProducts.length > 0 ? storeProducts : local.storeProducts,
      orders: orders.length > 0 ? orders : local.orders,
      ideas: ideas.length > 0 ? ideas : local.ideas,
      notifications: (notifications.length > 0 ? notifications : local.notifications).filter(
        (n) => !(n.actorId && n.recipientId && n.actorId === n.recipientId) && n.entityId !== 'ev-summit-2026',
      ),
    };
    writeSnapshot(merged);
    return { status: 'connected', snapshot: merged };
  } catch (err) {
    return {
      status: 'offline',
      snapshot: local,
      errorMessage: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// Background write helpers with error catches to prevent unhandled rejections
export async function dbUpsertProfile(profile: UserProfile) {
  try {
    await supabase.from('profiles').upsert(toProfileRow(profile));
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertArticle(article: Article) {
  try {
    await supabase.from('articles').upsert(toArticleRow(article));
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertPost(post: CommunityPost) {
  try {
    await supabase.from('posts').upsert(toPostRow(post));
  } catch {
    // local-first fallback
  }
}

export async function dbInsertComment(comment: Comment) {
  try {
    await supabase.from('comments').upsert({
      id: comment.id,
      target_type: comment.targetType ?? 'article',
      target_id: comment.targetId ?? '',
      author_id: comment.authorId,
      author: comment.author,
      avatar: comment.avatar,
      role: comment.role,
      text: comment.text,
      timestamp_label: comment.timestamp,
      likes: comment.likes,
      reaction_counts: comment.reactionCounts ?? {},
    });
  } catch {
    // local-first fallback
  }
}

export async function dbSetReaction(
  targetType: ReactionTargetType,
  targetId: string,
  user: UserProfile,
  reactionType: LinkedInReactionType | null,
  updatedCounts: Partial<Record<LinkedInReactionType, number>>,
  updatedTotal: number,
) {
  try {
    if (!reactionType) {
      await supabase
        .from('reactions')
        .delete()
        .match({ target_type: targetType, target_id: targetId, user_id: user.id });
    } else {
      await supabase.from('reactions').upsert(
        {
          id: `rx-${targetType}-${targetId}-${user.id}`,
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.avatar,
          user_role: `${user.role}${user.organization ? ` · ${user.organization}` : ''}`,
          type: reactionType,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'target_type,target_id,user_id' },
      );
    }
    if (targetType === 'article') {
      await supabase
        .from('articles')
        .update({ reaction_counts: updatedCounts })
        .eq('id', targetId);
    } else if (targetType === 'post') {
      await supabase
        .from('posts')
        .update({ reaction_counts: updatedCounts })
        .eq('id', targetId);
    } else if (targetType === 'reel') {
      await supabase
        .from('reels')
        .update({ reaction_counts: updatedCounts, likes: updatedTotal })
        .eq('id', targetId);
    } else if (targetType === 'comment') {
      await supabase
        .from('comments')
        .update({ reaction_counts: updatedCounts, likes: updatedTotal })
        .eq('id', targetId);
    }
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertReel(reel: StoryReel) {
  try {
    await supabase.from('reels').upsert({
      id: reel.id,
      title: reel.title,
      creator_id: reel.creatorId,
      creator: reel.creator,
      creator_avatar: reel.creatorAvatar,
      location: reel.location,
      duration: reel.duration,
      views: reel.views,
      gradient_theme: reel.gradientTheme,
      video_type: reel.videoType,
      media_url: reel.mediaUrl,
      video_url: reel.videoUrl ?? '',
      likes: reel.likes,
      reaction_counts: reel.reactionCounts ?? {},
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertStory(story: TopicStory) {
  try {
    await supabase.from('stories').upsert({
      id: story.id,
      title: story.title,
      category: story.category,
      image_url: story.imageUrl,
      icon_name: story.iconName,
      reads_count: story.readsCount ?? '0',
      author_id: story.authorId ?? '',
      author_name: story.authorName ?? '',
      author_avatar: story.authorAvatar ?? '',
      article_id: story.articleId ?? null,
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertProduct(product: StoreProduct) {
  try {
    await supabase.from('store_products').upsert({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      tag: product.tag,
      image: product.image,
      seller_id: product.sellerId,
      seller: product.seller,
      stock: product.stock,
      created_at: product.createdAt,
    });
  } catch {
    // local-first fallback
  }
}

export async function dbInsertOrder(order: BkashOrder) {
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      buyer_id: order.buyerId,
      buyer_name: order.buyerName,
      buyer_phone: order.buyerPhone,
      district: order.district,
      delivery_address: order.deliveryAddress,
      delivery_zone: order.deliveryZone,
      notes: order.notes ?? '',
      items: order.items,
      subtotal_bdt: order.subtotalBdt,
      delivery_fee_bdt: order.deliveryFeeBdt,
      total_bdt: order.totalBdt,
      receiver_bkash: BKASH_RECEIVER_NUMBER,
      sender_bkash: order.senderBkash,
      trx_id: order.trxId,
      payment_method: order.paymentMethod,
      payment_screenshot: order.paymentScreenshot ?? '',
      status: order.status,
      created_at: order.createdAt,
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertEvent(event: UpcomingEvent) {
  try {
    await supabase.from('events').upsert({
      id: event.id,
      title: event.title,
      date_month: event.dateMonth,
      date_day: event.dateDay,
      location: event.location,
      attendees_count: event.attendeesCount,
      organizer_id: event.organizerId ?? '',
      organizer_name: event.organizerName ?? '',
      description: event.description ?? '',
      external_link: event.externalLink ?? '',
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertResearchPaper(paper: ResearchPaper) {
  try {
    await supabase.from('research_papers').upsert({
      id: paper.id,
      institution: paper.institution,
      institution_code: paper.institutionCode,
      title: paper.title,
      summary: paper.summary,
      practical_impact: paper.practicalImpact,
      published_date: paper.publishedDate,
      researchers: paper.researchers,
      author_id: paper.authorId ?? '',
      doi_link: paper.doiLink ?? '',
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpsertIdea(idea: CommunityIdea) {
  try {
    await supabase.from('ideas').upsert({
      id: idea.id,
      title: idea.title,
      body: idea.body,
      author_id: idea.authorId,
      author: idea.author,
      author_avatar: idea.authorAvatar ?? '',
      votes: idea.votes,
      tag: idea.tag,
      created_at: idea.createdAt,
    });
  } catch {
    // local-first fallback
  }
}

export async function dbInsertNotification(notif: NotificationItem) {
  try {
    await supabase.from('notifications').upsert({
      id: notif.id,
      recipient_id: notif.recipientId ?? notif.userId ?? '',
      actor_id: notif.actorId ?? '',
      actor_name: notif.actorName ?? '',
      actor_avatar: notif.actorAvatar ?? '',
      type: notif.type ?? 'system',
      entity_type: notif.entityType ?? 'article',
      entity_id: notif.entityId ?? '',
      target_url: notif.targetUrl ?? notif.targetRoute ?? '/',
      message: notif.message || notif.title,
      is_read: Boolean(notif.isRead !== undefined ? notif.isRead : !notif.unread),
      created_at: notif.createdAt ?? new Date().toISOString(),
    });
  } catch {
    // local-first fallback
  }
}

export async function dbUpdateNotificationRead(id: string, isRead: boolean) {
  try {
    await supabase.from('notifications').update({ is_read: isRead }).eq('id', id);
  } catch {
    // fallback
  }
}

export async function dbMarkAllNotificationsRead(recipientId: string) {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', recipientId);
  } catch {
    // fallback
  }
}

export async function dbDeleteNotification(id: string) {
  try {
    await supabase.from('notifications').delete().eq('id', id);
  } catch {
    // fallback
  }
}

export async function dbDeletePost(id: string) {
  try {
    await supabase.from('posts').delete().eq('id', id);
  } catch {
    // fallback
  }
}

export async function dbDeleteStory(id: string) {
  try {
    await supabase.from('stories').delete().eq('id', id);
  } catch {
    // fallback
  }
}

export async function dbDeleteArticle(id: string) {
  try {
    await supabase.from('articles').delete().eq('id', id);
  } catch {
    // fallback
  }
}

// Helper to compute updated reaction state in snapshot
export function mutateSnapshotReaction(
  snap: DatabaseSnapshot,
  targetType: ReactionTargetType,
  targetId: string,
  user: UserProfile,
  chosen: LinkedInReactionType,
): { next: DatabaseSnapshot; finalReaction: LinkedInReactionType | null; counts: Partial<Record<LinkedInReactionType, number>>; total: number } {
  const existing = snap.reactions.find(
    (r) => r.targetType === targetType && r.targetId === targetId && r.userId === user.id,
  );
  const finalReaction: LinkedInReactionType | null = existing?.type === chosen ? null : chosen;
  const filtered = snap.reactions.filter(
    (r) => !(r.targetType === targetType && r.targetId === targetId && r.userId === user.id),
  );
  const nextReactions: ReactionRecord[] = finalReaction
    ? [
        {
          id: `rx-${targetType}-${targetId}-${user.id}`,
          targetType,
          targetId,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          userRole: `${user.role}${user.organization ? ` · ${user.organization}` : ''}`,
          type: finalReaction,
          createdAt: new Date().toISOString(),
        },
        ...filtered,
      ]
    : filtered;

  let counts: Partial<Record<LinkedInReactionType, number>> = {};
  let total = 0;

  const nextArticles = snap.articles.map((a) => {
    if (targetType !== 'article' || a.id !== targetId) return a;
    counts = applyReactionChange(a.reactionCounts, existing?.type ?? a.userReaction, finalReaction);
    const delta = (finalReaction ? 1 : 0) - (existing?.type || a.userReaction ? 1 : 0);
    total = Math.max(0, a.stats.likes + delta);
    return {
      ...a,
      reactionCounts: counts,
      userReaction: finalReaction,
      userLiked: !!finalReaction,
      stats: { ...a.stats, likes: total },
    };
  });

  const nextPosts = snap.posts.map((p) => {
    if (targetType !== 'post' || p.id !== targetId) return p;
    counts = applyReactionChange(p.reactionCounts, existing?.type ?? p.userReaction, finalReaction);
    const delta = (finalReaction ? 1 : 0) - (existing?.type || p.userReaction ? 1 : 0);
    total = Math.max(0, p.stats.likes + delta);
    return {
      ...p,
      reactionCounts: counts,
      userReaction: finalReaction,
      userLiked: !!finalReaction,
      stats: { ...p.stats, likes: total },
    };
  });

  const nextReels = snap.reels.map((r) => {
    if (targetType !== 'reel' || r.id !== targetId) return r;
    counts = applyReactionChange(r.reactionCounts, existing?.type ?? r.userReaction, finalReaction);
    const delta = (finalReaction ? 1 : 0) - (existing?.type || r.userReaction ? 1 : 0);
    total = Math.max(0, r.likes + delta);
    return {
      ...r,
      reactionCounts: counts,
      userReaction: finalReaction,
      likes: total,
    };
  });

  const nextComments = snap.comments.map((c) => {
    if (targetType !== 'comment' || c.id !== targetId) return c;
    counts = applyReactionChange(c.reactionCounts, existing?.type ?? c.userReaction, finalReaction);
    const delta = (finalReaction ? 1 : 0) - (existing?.type || c.userReaction ? 1 : 0);
    total = Math.max(0, c.likes + delta);
    return {
      ...c,
      reactionCounts: counts,
      userReaction: finalReaction,
      likes: total,
    };
  });

  const next: DatabaseSnapshot = {
    ...snap,
    reactions: nextReactions,
    articles: nextArticles.map((a) => ({
      ...a,
      comments: nextComments.filter((c) => c.targetType === 'article' && c.targetId === a.id),
    })),
    posts: nextPosts.map((p) => ({
      ...p,
      comments: nextComments.filter((c) => c.targetType === 'post' && c.targetId === p.id),
    })),
    reels: nextReels,
    comments: nextComments,
  };

  return { next, finalReaction, counts, total };
}

export async function dbToggleFollow(followerId: string, followingId: string, isFollowing: boolean): Promise<void> {
  if (!followerId || !followingId) return;
  try {
    if (isFollowing) {
      await supabase.from('follows').upsert(
        { follower_id: followerId, following_id: followingId },
        { onConflict: 'follower_id,following_id' },
      );
    } else {
      await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
    }
  } catch (err) {
    console.warn('Failed to sync follow state to Supabase:', err);
  }
}
