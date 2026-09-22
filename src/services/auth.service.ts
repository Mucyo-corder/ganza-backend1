import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { User, UserRole } from '../types/index.ts';
import { BusinessService } from './business.service.ts';
import { getFirebaseAuth } from '../config/firebase.ts';

const userRepo = new FirestoreRepository<User>('users');

export class AuthService {
  static async register(d:{email:string;password?:string;name:string;phone?:string;role?:UserRole;businessName?:string}) {
    if(!d.password) throw new Error('Ijambo ry’ibanga rirakenewe.');
    const a=getFirebaseAuth();
    let f;
    try { f=await a.createUser({email:d.email,password:d.password,displayName:d.name,...(d.phone?{phoneNumber:d.phone}:{})}); }
    catch(e:any){if(e?.code==='auth/email-already-exists')throw new Error('Iyi emeli isanzwe ikoreshwa muri system.');throw e;}
    const u=await userRepo.create({id:f.uid,email:f.email||d.email,name:d.name,phone:d.phone,role:d.role||'owner',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    let businessId;
    if(d.businessName){const r=await BusinessService.createBusiness(f.uid,{name:d.businessName,phone:d.phone||'0780000000',email:d.email,address:{district:'Kigali',description:'Aho bakorera'}});businessId=r.business.id;await userRepo.update(f.uid,businessId,{businessId});}
    return {user:{...u,businessId},token:await a.createCustomToken(f.uid,{role:d.role||'owner',...(businessId?{businessId}:{})}),businessId};
  }
  static async login(_d:any):Promise<never>{throw new Error("Koresha Firebase Authentication.");}
  static async getMe(id:string){return userRepo.findById(id);}
}