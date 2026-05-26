import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Medicine, MedicineDocument } from './medicine.schema';

const SEED: Partial<Medicine>[] = [
  { name: 'Napa 500mg', genericName: 'Paracetamol', manufacturer: 'Beximco Pharmaceuticals', uses: ['Pain relief', 'Fever reduction'], sideEffects: ['Liver damage in overdose'], fakeIndicators: ['Missing Beximco logo', 'Poor blister print quality'], safeAlternatives: ['Ace 500mg', 'Paracetamol generic'], price: 1.5, requiresPrescription: false },
  { name: 'Napa Extra', genericName: 'Paracetamol + Caffeine', manufacturer: 'Beximco Pharmaceuticals', uses: ['Headache', 'Migraine', 'Cold symptoms'], sideEffects: ['Insomnia', 'Palpitations'], fakeIndicators: ['Missing Beximco branding', 'No batch number on strip'], safeAlternatives: ['Ace Plus', 'Paracetamol generic'], price: 2.0, requiresPrescription: false },
  { name: 'Seclo 20mg', genericName: 'Omeprazole', manufacturer: 'Square Pharmaceuticals', uses: ['Acid reflux', 'Peptic ulcer', 'GERD'], sideEffects: ['Headache', 'Diarrhea'], fakeIndicators: ['Capsule discolored', 'No Square seal'], safeAlternatives: ['Losectil 20mg', 'Omeprazole generic'], price: 5.0, requiresPrescription: true },
  { name: 'Amodis 400mg', genericName: 'Metronidazole', manufacturer: 'Square Pharmaceuticals', uses: ['Bacterial infections', 'Amoebic dysentery'], sideEffects: ['Nausea', 'Metallic taste'], fakeIndicators: ['No score line', 'Faded packaging color'], safeAlternatives: ['Metronidazole generic', 'Flagyl'], price: 3.5, requiresPrescription: true },
  { name: 'Ciprocin 500mg', genericName: 'Ciprofloxacin', manufacturer: 'Square Pharmaceuticals', uses: ['Typhoid', 'UTI', 'Respiratory infections'], sideEffects: ['Nausea', 'Tendon damage (rare)'], fakeIndicators: ['Not bright white', 'Blurred imprint'], safeAlternatives: ['Ciprofloxacin generic', 'Cifran'], price: 12.0, requiresPrescription: true },
  { name: 'Losectil 20mg', genericName: 'Omeprazole', manufacturer: 'Incepta Pharmaceuticals', uses: ['GERD', 'Gastric ulcer'], sideEffects: ['Headache', 'Nausea'], fakeIndicators: ['Inconsistent capsule color', 'Missing Incepta branding'], safeAlternatives: ['Seclo 20mg', 'Omeprazole generic'], price: 4.5, requiresPrescription: true },
  { name: 'Metformin 500mg', genericName: 'Metformin HCl', manufacturer: 'Various', uses: ['Type 2 diabetes', 'Blood sugar control'], sideEffects: ['Nausea', 'Diarrhea'], fakeIndicators: ['Uneven tablet size', 'Faded imprint'], safeAlternatives: ['Glucophage', 'Diaformin'], price: 2.0, requiresPrescription: true },
  { name: 'Atenolol 50mg', genericName: 'Atenolol', manufacturer: 'Various', uses: ['Hypertension', 'Angina'], sideEffects: ['Fatigue', 'Bradycardia'], fakeIndicators: ['No score line', 'Missing embossing'], safeAlternatives: ['Tenormin', 'Aten'], price: 3.0, requiresPrescription: true },
  { name: 'Omeprazole 20mg', genericName: 'Omeprazole', manufacturer: 'Various', uses: ['Acid reflux', 'GERD', 'Gastric ulcers'], sideEffects: ['Headache', 'Vitamin B12 deficiency long-term'], fakeIndicators: ['Capsule opens without resistance', 'No enteric coating'], safeAlternatives: ['Seclo', 'Losectil'], price: 4.0, requiresPrescription: false },
  { name: 'Azithromycin 250mg', genericName: 'Azithromycin', manufacturer: 'Various', uses: ['Respiratory infections', 'Skin infections'], sideEffects: ['Nausea', 'Cardiac arrhythmia (rare)'], fakeIndicators: ['Coating peels unevenly', 'Spelling errors on packaging'], safeAlternatives: ['Zithromax', 'Azicin'], price: 20.0, requiresPrescription: true },
  { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', manufacturer: 'Various', uses: ['Bacterial infections', 'Respiratory tract infections'], sideEffects: ['Diarrhea', 'Rash', 'Allergic reactions'], fakeIndicators: ['Powder leaking from capsule', 'Discoloration'], safeAlternatives: ['Moxacil', 'Amoxil'], price: 8.0, requiresPrescription: true },
  { name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', manufacturer: 'Various', uses: ['Allergic rhinitis', 'Urticaria'], sideEffects: ['Drowsiness', 'Dry mouth'], fakeIndicators: ['Inconsistent tablet size', 'No scored line'], safeAlternatives: ['Zirtec', 'Aller-C'], price: 2.5, requiresPrescription: false },
  { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', manufacturer: 'Various', uses: ['High blood pressure', 'Angina'], sideEffects: ['Ankle swelling', 'Flushing'], fakeIndicators: ['Tablet sticks together', 'Missing trademark'], safeAlternatives: ['Amlovas', 'Norvasc'], price: 4.0, requiresPrescription: true },
  { name: 'Losartan 50mg', genericName: 'Losartan Potassium', manufacturer: 'Various', uses: ['Hypertension', 'Heart failure'], sideEffects: ['Dizziness', 'Hyperkalemia'], fakeIndicators: ['No hologram', 'Inconsistent color'], safeAlternatives: ['Cozaar', 'Losacar'], price: 6.0, requiresPrescription: true },
  { name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin HCl', manufacturer: 'Various', uses: ['UTI', 'Bacterial diarrhea', 'Typhoid'], sideEffects: ['Tendon rupture risk', 'Photosensitivity'], fakeIndicators: ['Surface pitting', 'No company logo'], safeAlternatives: ['Ciprocin', 'Cifran'], price: 10.0, requiresPrescription: true },
  { name: 'Diazepam 5mg', genericName: 'Diazepam', manufacturer: 'Various', uses: ['Anxiety', 'Muscle spasms', 'Seizures'], sideEffects: ['Drowsiness', 'Dependence'], fakeIndicators: ['Easy seal break', 'Tablet crumbles'], safeAlternatives: ['Valium', 'Seduxen'], price: 5.0, requiresPrescription: true },
  { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole Sodium', manufacturer: 'Various', uses: ['GERD', 'Erosive esophagitis'], sideEffects: ['Headache', 'Diarrhea'], fakeIndicators: ['Enteric coating missing', 'Packaging seal peeled'], safeAlternatives: ['Pantop', 'Protonix'], price: 7.0, requiresPrescription: true },
  { name: 'Clopidogrel 75mg', genericName: 'Clopidogrel Bisulfate', manufacturer: 'Various', uses: ['Heart attack prevention', 'Stroke prevention'], sideEffects: ['Bleeding risk', 'Bruising'], fakeIndicators: ['Non-standard pink color', 'No debossing', 'Missing tamper seal'], safeAlternatives: ['Plavix', 'Clopilet'], price: 15.0, requiresPrescription: true },
  { name: 'Fluconazole 150mg', genericName: 'Fluconazole', manufacturer: 'Various', uses: ['Candidiasis', 'Fungal infections'], sideEffects: ['Nausea', 'Hepatotoxicity (rare)'], fakeIndicators: ['Inconsistent capsule weight', 'Broken foil seal'], safeAlternatives: ['Diflucan', 'Flucoral'], price: 18.0, requiresPrescription: true },
  { name: 'Prednisolone 5mg', genericName: 'Prednisolone', manufacturer: 'Various', uses: ['Inflammatory conditions', 'Asthma', 'Autoimmune diseases'], sideEffects: ['Weight gain', 'Immunosuppression'], fakeIndicators: ['Tablet crumbles', 'No debossed dosage'], safeAlternatives: ['Deltacortril', 'Meticortelone'], price: 3.0, requiresPrescription: true },
  { name: 'Glimepiride 2mg', genericName: 'Glimepiride', manufacturer: 'Various', uses: ['Type 2 diabetes'], sideEffects: ['Hypoglycemia', 'Weight gain'], fakeIndicators: ['Tablet size variation', 'Wrong hue of pink'], safeAlternatives: ['Amaryl', 'Glimpid'], price: 8.0, requiresPrescription: true },
  { name: 'Rabeprazole 20mg', genericName: 'Rabeprazole Sodium', manufacturer: 'Various', uses: ['GERD', 'Peptic ulcer'], sideEffects: ['Headache', 'Flatulence'], fakeIndicators: ['Absent enteric coating', 'Missing product code'], safeAlternatives: ['Aciphex', 'Razo'], price: 9.0, requiresPrescription: true },
  { name: 'Amitriptyline 25mg', genericName: 'Amitriptyline HCl', manufacturer: 'Various', uses: ['Depression', 'Neuropathic pain'], sideEffects: ['Drowsiness', 'Dry mouth', 'Cardiac effects'], fakeIndicators: ['Uneven coating', 'No scored line', 'Missing schedule info'], safeAlternatives: ['Elavil', 'Tryptanol'], price: 4.0, requiresPrescription: true },
  { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', manufacturer: 'GlaxoSmithKline', uses: ['Asthma', 'COPD', 'Bronchospasm'], sideEffects: ['Tremor', 'Palpitations'], fakeIndicators: ['Wrong nozzle color (not blue)', 'Light canister weight', 'No dose counter'], safeAlternatives: ['Ventolin', 'Asthalin'], price: 150.0, requiresPrescription: false },
  { name: 'Doxycycline 100mg', genericName: 'Doxycycline Hyclate', manufacturer: 'Various', uses: ['Bacterial infections', 'Malaria prophylaxis', 'Acne'], sideEffects: ['Photosensitivity', 'Nausea'], fakeIndicators: ['Not yellow capsule color', 'Brown discolored powder'], safeAlternatives: ['Vibramycin', 'Doxylin'], price: 12.0, requiresPrescription: true },
  { name: 'Folic Acid 5mg', genericName: 'Folic Acid', manufacturer: 'Various', uses: ['Folate deficiency', 'Pregnancy supplementation'], sideEffects: ['Nausea at high doses'], fakeIndicators: ['Inconsistent yellow color', 'No expiry on strip'], safeAlternatives: ['Folate', 'Folicare'], price: 1.0, requiresPrescription: false },
  { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium', manufacturer: 'Various', uses: ['High cholesterol', 'Cardiovascular prevention'], sideEffects: ['Muscle pain', 'Liver enzyme elevation'], fakeIndicators: ['Irregular shape', 'Chalk-like texture', 'Missing hologram'], safeAlternatives: ['Lipitor', 'Atova'], price: 10.0, requiresPrescription: true },
  { name: 'Insulin Regular 100IU/mL', genericName: 'Human Insulin', manufacturer: 'Novo Nordisk', uses: ['Type 1 diabetes', 'Type 2 diabetes'], sideEffects: ['Hypoglycemia', 'Injection site reactions'], fakeIndicators: ['Cloudy when should be clear', 'No cold chain seal'], safeAlternatives: ['Actrapid', 'Humulin R'], price: 350.0, requiresPrescription: true },
  { name: 'Paracetamol 500mg', genericName: 'Paracetamol', manufacturer: 'Various', uses: ['Pain relief', 'Fever reduction'], sideEffects: ['Liver damage in overdose', 'Nausea'], fakeIndicators: ['Unusual smell', 'Crumbling texture', 'No embossed marking'], safeAlternatives: ['Napa', 'Ace', 'Typenol'], price: 1.5, requiresPrescription: false },
  { name: 'Metronidazole 400mg', genericName: 'Metronidazole', manufacturer: 'Various', uses: ['Anaerobic bacterial infections', 'Protozoal infections'], sideEffects: ['Metallic taste', 'Nausea', 'Peripheral neuropathy'], fakeIndicators: ['Tablet crumbles', 'No batch code', 'Poor label print quality'], safeAlternatives: ['Amodis', 'Flagyl'], price: 3.0, requiresPrescription: true },
];

@Injectable()
export class MedicinesService implements OnModuleInit {
  constructor(
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    private httpService: HttpService,
  ) {}

  async onModuleInit() {
    const count = await this.medicineModel.countDocuments();
    if (count < 30) {
      for (const med of SEED) {
        await this.medicineModel.updateOne(
          { name: med.name },
          { $setOnInsert: med },
          { upsert: true },
        );
      }
    }
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.medicineModel.find().skip(skip).limit(limit).lean(),
      this.medicineModel.countDocuments(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const med = await this.medicineModel.findById(id).lean();
    if (!med) throw new NotFoundException('Medicine not found');
    return med;
  }

  async search(q: string) {
    const pythonUrl = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000';
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${pythonUrl}/search`, { params: { q } }),
      );
      return res.data;
    } catch {
      return [];
    }
  }

  async create(dto: Partial<Medicine>) {
    return this.medicineModel.create(dto);
  }

  async update(id: string, dto: Partial<Medicine>) {
    const med = await this.medicineModel.findByIdAndUpdate(id, dto, { new: true });
    if (!med) throw new NotFoundException('Medicine not found');
    return med;
  }

  async remove(id: string) {
    const med = await this.medicineModel.findByIdAndDelete(id);
    if (!med) throw new NotFoundException('Medicine not found');
    return { deleted: true };
  }
}
