import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface FinancialData {
  revenue: number;
  outstandingInvoices: number;
  expenses: number;
  profitMargin: number;
  monthlyChange: number;
}

interface FinancialSummaryProps {
  financialData: FinancialData;
}

const FinancialSummary = ({ financialData }: FinancialSummaryProps) => {
  const [timePeriod, setTimePeriod] = useState("this-month");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Summary</h3>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-base font-medium text-gray-900">Revenue</h4>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(financialData.revenue)}
            </p>
            <p className={`text-sm ${financialData.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financialData.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.monthlyChange)}% from last month
            </p>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="This Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Outstanding Invoices</h4>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {formatCurrency(financialData.outstandingInvoices)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-yellow-500 h-2.5 rounded-full" 
                style={{ width: `${(financialData.outstandingInvoices / financialData.revenue) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Expenses</h4>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {formatCurrency(financialData.expenses)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-red-500 h-2.5 rounded-full" 
                style={{ width: `${(financialData.expenses / financialData.revenue) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Profit Margin</h4>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {financialData.profitMargin.toFixed(1)}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${financialData.profitMargin}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <Link href="/reports" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View detailed reports
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FinancialSummary;
