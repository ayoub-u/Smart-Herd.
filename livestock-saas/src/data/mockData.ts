import type {
  Animal, MilkRecord, HealthRecord, VaccinationSchedule,
  ReproductionRecord, FeedInventory, Notification,
  ProfitabilityRecord, MonthlyMilk,
} from "@/types";

const FARM_ID = "farm_001";

// ── Animals ───────────────────────────────────────────────────────────────────
export const animals: Animal[] = [
  { id:"A001", farmId:FARM_ID, name:"Bella",  tag:"COW-001", rfid:"982000123456789", type:"cow",   breed:"Holstein Friesian", dateOfBirth:"2020-03-15", weight:620, healthStatus:"healthy",   pregnancyStatus:"lactating", milkYieldToday:32.5, milkYieldAvg:30.2, lactationNumber:3, daysInMilk:145, lastVaccination:"2024-01-10", nextVaccination:"2024-07-10", sire:"Max-EX",    dam:"Rosa-VG",  location:"Barn A",     notes:"Excellent producer. Top performer.",    acquisitionDate:"2020-04-01", acquisitionCost:2200 },
  { id:"A002", farmId:FARM_ID, name:"Luna",   tag:"COW-002", rfid:"982000123456790", type:"cow",   breed:"Jersey",            dateOfBirth:"2019-06-20", weight:490, healthStatus:"healthy",   pregnancyStatus:"pregnant",  milkYieldToday:22.1, milkYieldAvg:24.5, lactationNumber:4, daysInMilk:210, lastVaccination:"2024-02-14", nextVaccination:"2024-08-14", sire:"Duke-GP",   dam:"Daisy-EX", location:"Barn B",     notes:"High butterfat. Due in 45 days.",       acquisitionDate:"2019-07-15", acquisitionCost:1800, inseminationDate:"2024-01-20", expectedBirthDate:"2024-10-25" },
  { id:"A003", farmId:FARM_ID, name:"Rosie",  tag:"COW-003", rfid:"982000123456791", type:"cow",   breed:"Simmental",         dateOfBirth:"2021-01-08", weight:580, healthStatus:"recovering", pregnancyStatus:"open",      milkYieldToday:18.3, milkYieldAvg:26.0, lactationNumber:2, daysInMilk:89,  lastVaccination:"2024-03-01", nextVaccination:"2024-09-01", sire:"Atlas-GP",  dam:"Lily-VG",  location:"Barn A",     notes:"Recovering from mild mastitis.",        acquisitionDate:"2021-02-20", acquisitionCost:1950 },
  { id:"A004", farmId:FARM_ID, name:"Daisy",  tag:"COW-004", rfid:"982000123456792", type:"cow",   breed:"Holstein Friesian", dateOfBirth:"2018-09-12", weight:650, healthStatus:"healthy",   pregnancyStatus:"pregnant",  milkYieldToday:28.7, milkYieldAvg:29.1, lactationNumber:5, daysInMilk:178, lastVaccination:"2024-01-25", nextVaccination:"2024-07-25", sire:"Legend-EX", dam:"Pearl-GP", location:"Barn C",     notes:"Senior cow, excellent temperament.",    acquisitionDate:"2018-10-05", acquisitionCost:2500, inseminationDate:"2024-02-10", expectedBirthDate:"2024-11-20" },
  { id:"A005", farmId:FARM_ID, name:"Molly",  tag:"COW-005", rfid:"982000123456793", type:"cow",   breed:"Brown Swiss",       dateOfBirth:"2022-04-22", weight:540, healthStatus:"healthy",   pregnancyStatus:"lactating", milkYieldToday:26.4, milkYieldAvg:25.8, lactationNumber:1, daysInMilk:67,  lastVaccination:"2024-04-01", nextVaccination:"2024-10-01", sire:"Bruno-VG",  dam:"Heidi-EX", location:"Barn B",     notes:"First lactation. Good potential.",      acquisitionDate:"2022-05-10", acquisitionCost:1600 },
  { id:"A006", farmId:FARM_ID, name:"Cleo",   tag:"COW-006", rfid:"982000123456794", type:"cow",   breed:"Ayrshire",          dateOfBirth:"2020-11-30", weight:510, healthStatus:"healthy",   pregnancyStatus:"dry",       milkYieldToday:0,    milkYieldAvg:22.3, lactationNumber:3, daysInMilk:0,   lastVaccination:"2024-02-20", nextVaccination:"2024-08-20", sire:"Scott-GP",  dam:"Fiona-VG", location:"Pasture",    notes:"Dry period. Calving in 60 days.",       acquisitionDate:"2020-12-15", acquisitionCost:1750, inseminationDate:"2024-01-05", expectedBirthDate:"2024-10-10" },
  { id:"A007", farmId:FARM_ID, name:"Thor",   tag:"BULL-001",rfid:"982000123456795", type:"bull",  breed:"Holstein Friesian", dateOfBirth:"2019-02-14", weight:950, healthStatus:"healthy",   pregnancyStatus:"open",      milkYieldToday:0,    milkYieldAvg:0,    lactationNumber:0, daysInMilk:0,   lastVaccination:"2024-01-15", nextVaccination:"2024-07-15", sire:"Titan-EX",  dam:"Athena-GP",location:"Bull Pen",   notes:"Herd sire. Excellent genetics.",        acquisitionDate:"2019-03-01", acquisitionCost:5500 },
  { id:"A008", farmId:FARM_ID, name:"Flora",  tag:"COW-007", rfid:"982000123456796", type:"cow",   breed:"Montbéliarde",      dateOfBirth:"2021-07-18", weight:560, healthStatus:"healthy",   pregnancyStatus:"lactating", milkYieldToday:30.1, milkYieldAvg:28.9, lactationNumber:2, daysInMilk:123, lastVaccination:"2024-03-10", nextVaccination:"2024-09-10", sire:"Maestro-EX",dam:"Fleur-VG", location:"Barn A",     notes:"Strong conformation.",                  acquisitionDate:"2021-08-01", acquisitionCost:2100 },
  { id:"A009", farmId:FARM_ID, name:"Nala",   tag:"SHE-001", rfid:"982000123456797", type:"sheep", breed:"Merino",            dateOfBirth:"2022-02-28", weight:65,  healthStatus:"healthy",   pregnancyStatus:"pregnant",  milkYieldToday:1.8,  milkYieldAvg:2.1,  lactationNumber:1, daysInMilk:45,  lastVaccination:"2024-02-01", nextVaccination:"2024-08-01", sire:"King-M",    dam:"Eva-M",    location:"Sheep Pen A",notes:"Fine wool. Good mother.",               acquisitionDate:"2022-03-15", acquisitionCost:350,  inseminationDate:"2024-03-10", expectedBirthDate:"2024-08-05" },
  { id:"A010", farmId:FARM_ID, name:"Amber",  tag:"SHE-002", rfid:"982000123456798", type:"sheep", breed:"Awassi",            dateOfBirth:"2021-12-10", weight:72,  healthStatus:"healthy",   pregnancyStatus:"lactating", milkYieldToday:2.5,  milkYieldAvg:2.8,  lactationNumber:2, daysInMilk:88,  lastVaccination:"2024-01-20", nextVaccination:"2024-07-20", sire:"Ram-01",    dam:"Sera-A",   location:"Sheep Pen B",notes:"High milk fat.",                        acquisitionDate:"2022-01-05", acquisitionCost:420 },
  { id:"A011", farmId:FARM_ID, name:"Grace",  tag:"COW-008", rfid:"982000123456799", type:"cow",   breed:"Holstein Friesian", dateOfBirth:"2019-05-25", weight:630, healthStatus:"sick",      pregnancyStatus:"open",      milkYieldToday:12.0, milkYieldAvg:28.5, lactationNumber:4, daysInMilk:201, lastVaccination:"2024-01-05", nextVaccination:"2024-07-05", sire:"Max-EX",    dam:"Hope-GP",  location:"Sick Bay",   notes:"Fever. Vet visit scheduled.",           acquisitionDate:"2019-06-10", acquisitionCost:2300 },
  { id:"A012", farmId:FARM_ID, name:"Pearl",  tag:"COW-009", rfid:"982000123456800", type:"cow",   breed:"Guernsey",          dateOfBirth:"2020-08-14", weight:500, healthStatus:"healthy",   pregnancyStatus:"lactating", milkYieldToday:24.8, milkYieldAvg:23.9, lactationNumber:3, daysInMilk:156, lastVaccination:"2024-02-28", nextVaccination:"2024-08-28", sire:"Prince-EX", dam:"Queen-VG", location:"Barn C",     notes:"High beta-carotene milk.",              acquisitionDate:"2020-09-01", acquisitionCost:1900 },
];

// ── Milk Records ──────────────────────────────────────────────────────────────
export const mockMilkRecords: MilkRecord[] = [
  { id:"M001", farmId:FARM_ID, date:"2024-07-01", morning:285, afternoon:198, evening:247, total:730,  quality:"A", fatContent:3.8, proteinContent:3.2 },
  { id:"M002", farmId:FARM_ID, date:"2024-07-02", morning:292, afternoon:201, evening:251, total:744,  quality:"A", fatContent:3.9, proteinContent:3.3 },
  { id:"M003", farmId:FARM_ID, date:"2024-07-03", morning:278, afternoon:195, evening:239, total:712,  quality:"A", fatContent:3.7, proteinContent:3.1 },
  { id:"M004", farmId:FARM_ID, date:"2024-07-04", morning:301, afternoon:208, evening:258, total:767,  quality:"A", fatContent:4.0, proteinContent:3.4 },
  { id:"M005", farmId:FARM_ID, date:"2024-07-05", morning:267, afternoon:185, evening:231, total:683,  quality:"B", fatContent:3.6, proteinContent:3.0 },
  { id:"M006", farmId:FARM_ID, date:"2024-07-06", morning:310, afternoon:215, evening:268, total:793,  quality:"A", fatContent:4.1, proteinContent:3.5 },
  { id:"M007", farmId:FARM_ID, date:"2024-07-07", morning:298, afternoon:207, evening:254, total:759,  quality:"A", fatContent:3.9, proteinContent:3.2 },
  { id:"M008", farmId:FARM_ID, date:"2024-07-08", morning:288, afternoon:199, evening:243, total:730,  quality:"A", fatContent:3.8, proteinContent:3.1 },
  { id:"M009", farmId:FARM_ID, date:"2024-07-09", morning:275, afternoon:190, evening:236, total:701,  quality:"B", fatContent:3.7, proteinContent:3.0 },
  { id:"M010", farmId:FARM_ID, date:"2024-07-10", morning:303, afternoon:211, evening:261, total:775,  quality:"A", fatContent:4.0, proteinContent:3.3 },
  { id:"M011", farmId:FARM_ID, date:"2024-07-11", morning:295, afternoon:204, evening:249, total:748,  quality:"A", fatContent:3.9, proteinContent:3.2 },
  { id:"M012", farmId:FARM_ID, date:"2024-07-12", morning:284, afternoon:197, evening:242, total:723,  quality:"A", fatContent:3.8, proteinContent:3.1 },
  { id:"M013", farmId:FARM_ID, date:"2024-07-13", morning:308, afternoon:213, evening:265, total:786,  quality:"A", fatContent:4.1, proteinContent:3.4 },
  { id:"M014", farmId:FARM_ID, date:"2024-07-14", morning:291, afternoon:202, evening:247, total:740,  quality:"A", fatContent:3.9, proteinContent:3.2 },
];

export const mockMonthlyMilk: MonthlyMilk[] = [
  { month:"Jan", liters:18420, revenue:9210 },
  { month:"Feb", liters:17890, revenue:8945 },
  { month:"Mar", liters:19340, revenue:9670 },
  { month:"Apr", liters:20120, revenue:10060 },
  { month:"May", liters:21450, revenue:10725 },
  { month:"Jun", liters:22100, revenue:11050 },
  { month:"Jul", liters:21800, revenue:10900 },
];

// ── Health Records ────────────────────────────────────────────────────────────
export const mockHealthRecords: HealthRecord[] = [
  { id:"H001", farmId:FARM_ID, animalId:"A001", date:"2024-01-10", type:"vaccination", description:"Annual BVD vaccination",            veterinarian:"Dr. Ahmed Benali",   medication:"BoviBVD",      dosage:"2ml IM",              cost:45,  nextFollowUp:"2024-07-10", notes:"No adverse reactions." },
  { id:"H002", farmId:FARM_ID, animalId:"A003", date:"2024-06-25", type:"treatment",   description:"Mastitis — left front quarter",     veterinarian:"Dr. Sara Mansouri",  medication:"Amoxicillin",  dosage:"10mg/kg daily 5 days",cost:120, nextFollowUp:"2024-07-05", notes:"Milk withheld 4 days. Recovering." },
  { id:"H003", farmId:FARM_ID, animalId:"A011", date:"2024-07-10", type:"checkup",     description:"Emergency fever investigation",      veterinarian:"Dr. Ahmed Benali",   medication:"Antipyretics", dosage:"As prescribed",        cost:200, nextFollowUp:"2024-07-13", notes:"Temp 40.2°C. Antibiotics started." },
  { id:"H004", farmId:FARM_ID, animalId:"A002", date:"2024-02-14", type:"vaccination", description:"IBR + PI3 booster",                  veterinarian:"Dr. Sara Mansouri",  medication:"Rispoval 4",   dosage:"5ml SC",               cost:55,  nextFollowUp:"2024-08-14", notes:"Intranasal route (pregnant cow)." },
  { id:"H005", farmId:FARM_ID, animalId:"A007", date:"2024-01-15", type:"checkup",     description:"Breeding soundness evaluation",      veterinarian:"Dr. Karim Tlemcani", cost:180, nextFollowUp:"2024-07-15", notes:"Passed BSE. Motility 70%. Morphology 85%." },
];

// ── Vaccination Schedule ──────────────────────────────────────────────────────
export const mockVaccinationSchedule: VaccinationSchedule[] = [
  { id:"V001", farmId:FARM_ID, animalId:"A001", animalName:"Bella", vaccine:"BVD Annual",       dueDate:"2024-07-10", status:"due-soon", priority:"high"   },
  { id:"V002", farmId:FARM_ID, animalId:"A007", animalName:"Thor",  vaccine:"BSE Booster",      dueDate:"2024-07-15", status:"due-soon", priority:"high"   },
  { id:"V003", farmId:FARM_ID, animalId:"A003", animalName:"Rosie", vaccine:"Leptospirosis",    dueDate:"2024-09-01", status:"scheduled",priority:"medium" },
  { id:"V004", farmId:FARM_ID, animalId:"A005", animalName:"Molly", vaccine:"Clostridial 8-way",dueDate:"2024-07-08", status:"overdue",  priority:"high"   },
  { id:"V005", farmId:FARM_ID, animalId:"A002", animalName:"Luna",  vaccine:"IBR Booster",      dueDate:"2024-08-14", status:"scheduled",priority:"medium" },
  { id:"V006", farmId:FARM_ID, animalId:"A009", animalName:"Nala",  vaccine:"Footrot",          dueDate:"2024-08-01", status:"scheduled",priority:"low"    },
  { id:"V007", farmId:FARM_ID, animalId:"A004", animalName:"Daisy", vaccine:"BVD Annual",       dueDate:"2024-07-07", status:"overdue",  priority:"high"   },
];

// ── Reproduction Records ──────────────────────────────────────────────────────
export const mockReproductionRecords: ReproductionRecord[] = [
  { id:"R001", farmId:FARM_ID, animalId:"A002", animalName:"Luna",  type:"insemination",    date:"2024-01-20", result:"confirmed", notes:"Second attempt. Successful.", technician:"Ali Hassan",       bull:"Duke-GP",  straws:"COGENT-7H2134", expectedDueDate:"2024-10-25" },
  { id:"R002", farmId:FARM_ID, animalId:"A004", animalName:"Daisy", type:"pregnancy-check", date:"2024-03-15", result:"pregnant",  notes:"Ultrasound confirmed. 35 days.",technician:"Dr. Ahmed Benali",                                  expectedDueDate:"2024-11-20" },
  { id:"R003", farmId:FARM_ID, animalId:"A006", animalName:"Cleo",  type:"insemination",    date:"2024-01-05", result:"confirmed", notes:"Heat detected by activity monitor.", technician:"Ali Hassan", bull:"Scott-GP", straws:"SEXED-SC456",   expectedDueDate:"2024-10-10" },
  { id:"R004", farmId:FARM_ID, animalId:"A001", animalName:"Bella", type:"heat",            date:"2024-07-05",                     notes:"Heat signs observed. Schedule AI." },
  { id:"R005", farmId:FARM_ID, animalId:"A009", animalName:"Nala",  type:"insemination",    date:"2024-03-10", result:"confirmed", notes:"Natural mating.",                   technician:"Farm staff",                                   expectedDueDate:"2024-08-05" },
];

// ── Feed Inventory ────────────────────────────────────────────────────────────
export const mockFeedInventory: FeedInventory[] = [
  { id:"F001", farmId:FARM_ID, name:"Alfalfa Hay",           category:"forage",      currentStock:8500,  unit:"kg", dailyUsage:450,  daysRemaining:18, costPerUnit:0.35, totalValue:2975,   reorderLevel:2000, supplier:"GreenFields Co.",  lastDelivery:"2024-06-20" },
  { id:"F002", farmId:FARM_ID, name:"Corn Silage",           category:"forage",      currentStock:25000, unit:"kg", dailyUsage:1200, daysRemaining:20, costPerUnit:0.12, totalValue:3000,   reorderLevel:5000, supplier:"Valley Silage",    lastDelivery:"2024-05-15" },
  { id:"F003", farmId:FARM_ID, name:"Dairy Concentrate 18%", category:"concentrate", currentStock:3200,  unit:"kg", dailyUsage:280,  daysRemaining:11, costPerUnit:0.68, totalValue:2176,   reorderLevel:1000, supplier:"NutriCow Ltd.",    lastDelivery:"2024-06-30" },
  { id:"F004", farmId:FARM_ID, name:"Wheat Straw",           category:"forage",      currentStock:12000, unit:"kg", dailyUsage:300,  daysRemaining:40, costPerUnit:0.18, totalValue:2160,   reorderLevel:3000, supplier:"GreenFields Co.",  lastDelivery:"2024-06-10" },
  { id:"F005", farmId:FARM_ID, name:"Calcium Limestone",     category:"mineral",     currentStock:250,   unit:"kg", dailyUsage:5,    daysRemaining:50, costPerUnit:1.20, totalValue:300,    reorderLevel:50,   supplier:"MineralPlus",      lastDelivery:"2024-06-01" },
  { id:"F006", farmId:FARM_ID, name:"Vitamin E Supplement",  category:"supplement",  currentStock:45,    unit:"kg", dailyUsage:2,    daysRemaining:22, costPerUnit:8.50, totalValue:382.5,  reorderLevel:10,   supplier:"VetNutrition",     lastDelivery:"2024-06-15" },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id:"N001", farmId:FARM_ID, type:"alert",   title:"Overdue Vaccination",  message:"Molly (COW-005) is 2 days overdue for Clostridial 8-way vaccination.", date:"2024-07-12", read:false, animalId:"A005", category:"health"       },
  { id:"N002", farmId:FARM_ID, type:"alert",   title:"Overdue Vaccination",  message:"Daisy (COW-004) BVD Annual vaccination was due on July 7.",            date:"2024-07-12", read:false, animalId:"A004", category:"health"       },
  { id:"N003", farmId:FARM_ID, type:"warning", title:"Low Feed Stock",       message:"Dairy Concentrate 18% has only 11 days remaining. Reorder now.",       date:"2024-07-12", read:false,                  category:"feed"         },
  { id:"N004", farmId:FARM_ID, type:"warning", title:"Sick Animal",          message:"Grace (COW-008) has a high fever (40.2°C). Vet attention required.",    date:"2024-07-10", read:false, animalId:"A011", category:"health"       },
  { id:"N005", farmId:FARM_ID, type:"info",    title:"Heat Detected",        message:"Bella (COW-001) showing heat signs. Insemination window: 12–18h.",     date:"2024-07-05", read:true,  animalId:"A001", category:"reproduction"  },
  { id:"N006", farmId:FARM_ID, type:"info",    title:"Vaccine Due in 3 Days",message:"Bella (COW-001) — BVD Annual due July 10.",                            date:"2024-07-07", read:true,                  category:"health"       },
  { id:"N007", farmId:FARM_ID, type:"warning", title:"Expected Calving",     message:"Cleo (COW-006) expected to calve in ~60 days. Prepare maternity pen.", date:"2024-07-01", read:true,  animalId:"A006", category:"reproduction"  },
  { id:"N008", farmId:FARM_ID, type:"success", title:"New Milk Record",      message:"New daily record: 793 liters on July 6th!",                            date:"2024-07-06", read:true,                  category:"production"   },
];

// ── Analytics ─────────────────────────────────────────────────────────────────
export const mockProfitabilityData: ProfitabilityRecord[] = [
  { month:"Jan", revenue:9210,  costs:6840, profit:2370 },
  { month:"Feb", revenue:8945,  costs:6650, profit:2295 },
  { month:"Mar", revenue:9670,  costs:7100, profit:2570 },
  { month:"Apr", revenue:10060, costs:7350, profit:2710 },
  { month:"May", revenue:10725, costs:7820, profit:2905 },
  { month:"Jun", revenue:11050, costs:8100, profit:2950 },
  { month:"Jul", revenue:10900, costs:7950, profit:2950 },
];

export const healthAnalytics = [
  { month:"Jan", healthy:9, sick:1, recovering:1 },
  { month:"Feb", healthy:10,sick:1, recovering:0 },
  { month:"Mar", healthy:9, sick:0, recovering:2 },
  { month:"Apr", healthy:10,sick:1, recovering:1 },
  { month:"May", healthy:10,sick:0, recovering:1 },
  { month:"Jun", healthy:9, sick:1, recovering:1 },
  { month:"Jul", healthy:9, sick:1, recovering:1 },
];

export const topProducers = [
  { name:"Bella", breed:"Holstein",    liters:32.5, trend:"+5%" },
  { name:"Flora", breed:"Montbéliarde",liters:30.1, trend:"+3%" },
  { name:"Daisy", breed:"Holstein",    liters:28.7, trend:"-2%" },
  { name:"Molly", breed:"Brown Swiss", liters:26.4, trend:"+8%" },
  { name:"Pearl", breed:"Guernsey",    liters:24.8, trend:"+1%" },
];
