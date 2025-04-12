import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  linkText: string;
  linkHref: string;
}

const StatCard = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  linkText,
  linkHref
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
              <div className={`${iconColor} text-xl`}>{icon}</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-semibold text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-2 sm:px-6">
        <div className="text-sm">
          <Link href={linkHref} className="font-medium text-primary-600 hover:text-primary-500">
            {linkText}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StatCard;
