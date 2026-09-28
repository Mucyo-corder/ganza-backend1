import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { MarketPrice } from '../types/index.ts';

const repo = new FirestoreRepository<MarketPrice>('market_prices');

export class MarketPriceService {
  static async search(params: {
    woodType: string;
    productName: string;
    unit: MarketPrice['unit'];
    species?: string;
  }) {
    const prices = await repo.findAll(500);
    const wood = params.woodType.toLowerCase();
    const product = params.productName.toLowerCase();

    return prices.filter(p =>
      p.verified &&
      p.woodType.toLowerCase() === wood &&
      p.productName.toLowerCase() === product &&
      p.unit === params.unit &&
      (!params.species || !p.species || p.species.toLowerCase() === params.species.toLowerCase())
    );
  }
}
