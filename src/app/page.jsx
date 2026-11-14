import Storefront from '../components/Storefront';
import { FoodIntro, BrandStory } from '../components/BrandStory';

export default function HomePage() {
  return <Storefront intro={<FoodIntro />} story={<BrandStory />} year={new Date().getFullYear()} />;
}
