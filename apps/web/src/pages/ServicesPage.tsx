import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { toPersianDigits, getPriorityBadgeVariant } from '@/lib/utils';
import { TicketPriorityLabelsPersian } from '@nit-help/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import {
  Layers,
  Search,
  Clock,
  Building2,
  ArrowLeft,
  Network,
  GraduationCap,
  Wrench,
  HelpCircle,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/services/categories');
      return res.data;
    },
  });

  // Extract all services
  const allServices = (categories || []).flatMap((c: any) =>
    (c.services || []).map((s: any) => ({
      ...s,
      categoryName: c.name,
      categoryIcon: c.icon,
    })),
  );

  const filteredServices = allServices.filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'ALL' || s.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Network':
        return <Network className="h-5 w-5" />;
      case 'GraduationCap':
        return <GraduationCap className="h-5 w-5" />;
      case 'Wrench':
        return <Wrench className="h-5 w-5" />;
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            کاتالوگ خدمات و میز خدمت دانشگاه
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            خدمت مورد نظر خود را در دسته‌بندی‌های زیر انتخاب کرده و جهت پیگیری الکترونیکی تیکت
            ارسال نمایید.
          </p>

          {/* Search Box */}
          <div className="pt-3 relative max-w-md">
            <Input
              type="text"
              placeholder="جستجو در نام یا شرح خدمات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
            <Search className="absolute right-3 top-5.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              selectedCategory === 'ALL'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            همه خدمات ({toPersianDigits(allServices.length)})
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                selectedCategory === c.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {getCategoryIcon(c.icon)}
              <span>{c.name}</span>
              <span className="opacity-75 text-[10px]">
                ({toPersianDigits(c.services?.length || 0)})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="خدمتی یافت نشد"
          description="با تغییر عبارت جستجو یا دسته‌بندی مجدداً تلاش فرمایید."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service: any) => (
            <Card
              key={service.id}
              className="flex flex-col justify-between hover:shadow-md transition-all hover:border-primary/40 group"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-primary/80 bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {service.categoryName}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadgeVariant(
                      service.defaultPriority,
                    )}`}
                  >
                    اولویت {TicketPriorityLabelsPersian[service.defaultPriority as keyof typeof TicketPriorityLabelsPersian]}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {service.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-3 leading-relaxed mt-2 text-muted-foreground">
                  {service.description || 'بدون توضیحات تکمیلی'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span>واحد پاسخگو: {service.department?.name || 'نامشخص'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span>
                    هدف پاسخ‌گویی: تا {toPersianDigits(service.targetResolutionHours)} ساعت کاری
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0 border-t border-border/50 mt-4">
                <Link to={`/tickets/new?serviceId=${service.id}`} className="w-full">
                  <Button variant="secondary" className="w-full justify-between text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <span>ثبت درخواست</span>
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

