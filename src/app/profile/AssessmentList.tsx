'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Globe2, ArrowRight } from 'lucide-react';

interface Assessment {
  id: string;
  product_name: string;
  category: string;
  created_at: string;
  readiness_score: number;
  target_markets: string[];
}

interface AssessmentListProps {
  assessments: Assessment[];
}

export default function AssessmentList({ assessments }: AssessmentListProps) {
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-500';
    if (score < 70) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="grid gap-6">
      {assessments.map((item, idx) => (
        <Link key={item.id} href={`/results/${item.id}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="group border-none shadow-xl glass hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-stretch">
                   <div className={`w-full sm:w-4 ${
                      (item.readiness_score || 0) < 40 ? 'bg-red-500/20' : 
                      (item.readiness_score || 0) < 70 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                   } group-hover:w-6 transition-all duration-500`} />
                   
                   <div className="p-8 flex-grow flex flex-col sm:flex-row justify-between items-center gap-8">
                     <div className="space-y-3 w-full sm:w-auto">
                       <div className="flex items-center gap-4 mb-1">
                         <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">
                           {item.product_name}
                         </h3>
                         <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                           {item.category}
                         </Badge>
                       </div>
                       <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400">
                         <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4" />
                           {new Date(item.created_at).toLocaleDateString('id-ID', { 
                             day: '2-digit', 
                             month: 'long', 
                             year: 'numeric' 
                           })}
                         </div>
                         <div className="flex items-center gap-2">
                           <Globe2 className="h-4 w-4" />
                           {item.target_markets?.[0] || 'Market Research'}
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-6 sm:pt-0">
                       <div className="text-right">
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Readiness Score</p>
                         <div className={`text-4xl font-black tracking-tighter ${getScoreColor(item.readiness_score || 0)} flex items-baseline gap-1`}>
                           {item.readiness_score || 0}%
                         </div>
                       </div>
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm group-hover:shadow-lg group-hover:translate-x-2">
                         <ArrowRight className="h-6 w-6" />
                       </div>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
