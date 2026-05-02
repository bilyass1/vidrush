import Link from 'next/link';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export default function PricingCard({
  name,
  price,
  period = '/mo',
  description,
  features,
  cta,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
        highlighted
          ? 'bg-purple-600 ring-2 ring-purple-400'
          : 'bg-[#111111] ring-1 ring-white/10'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-700">
            Most Popular
          </span>
        </div>
      )}

      <div>
        <p className={`text-sm font-medium ${highlighted ? 'text-purple-200' : 'text-gray-400'}`}>
          {name}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className={`text-sm ${highlighted ? 'text-purple-200' : 'text-gray-400'}`}>
            {period}
          </span>
        </div>
        <p className={`mt-2 text-sm ${highlighted ? 'text-purple-200' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>

      <ul className="flex flex-col gap-3 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              size={16}
              className={`mt-0.5 shrink-0 ${highlighted ? 'text-white' : 'text-purple-400'}`}
            />
            <span className={`text-sm ${highlighted ? 'text-white' : 'text-gray-300'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className={`rounded-lg px-4 py-3 text-sm font-semibold text-center transition-colors ${
          highlighted
            ? 'bg-white text-purple-700 hover:bg-purple-50'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
