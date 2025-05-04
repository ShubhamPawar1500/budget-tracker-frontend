import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function Cards({ title, amount, sign }) {
    function chooseSign() {
        switch (sign) {
            case 'TrendingUp':
                return (
                    <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>)
                break;

            case 'TrendingDown':
                return (
                    <div className="p-2 bg-red-100 rounded-full">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>)
                break;

            case 'DollarSign':
                return (
                    <div className="p-2 bg-blue-100 rounded-full">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>)
                break;

            default:
                return (
                    <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>)
                break;
        }
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">{title}</h3>
                {/* <div className="p-2 bg-green-100 rounded-full"> */}
                    {/* <TrendingUp className="h-5 w-5 text-green-600" /> */}
                    {chooseSign()}
                {/* </div> */}
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{amount}</p>
        </div>
    )
}