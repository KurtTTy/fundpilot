import { useState } from "react";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function CalculatorPage() {
  const { formatAmount } = useCurrency();

  // Basic calculator
  const [display, setDisplay] = useState<string>("0");
  const [memory, setMemory] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);

  // Loan calculator
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [loanInterest, setLoanInterest] = useState<number>(5);
  const [loanTerm, setLoanTerm] = useState<number>(5);

  // Savings calculator
  const [initialDeposit, setInitialDeposit] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(100);
  const [savingsInterest, setSavingsInterest] = useState<number>(3);
  const [savingsTerm, setSavingsTerm] = useState<number>(10);

  // Basic calculator functions
  const clearAll = () => {
    setDisplay("0");
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const toggleSign = () => {
    setDisplay(parseFloat(display) * -1 + "");
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay((value / 100) + "");
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (memory === null) {
      setMemory(inputValue);
    } else if (operation) {
      const currentValue = memory || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setMemory(newValue);
      setDisplay(newValue + "");
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return a / b;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (memory === null) {
      return;
    }

    if (operation) {
      const currentValue = memory || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setMemory(null);
      setDisplay(newValue + "");
      setWaitingForOperand(true);
      setOperation(null);
    }
  };

  // Calculate loan payment
  const calculateLoanPayment = () => {
    const principal = loanAmount;
    const monthlyRate = loanInterest / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) return principal / numberOfPayments;

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
  };

  // Calculate future savings
  const calculateFutureSavings = () => {
    const monthlyRate = savingsInterest / 100 / 12;
    const months = savingsTerm * 12;
    
    // Calculate future value of initial deposit
    const futureValueInitial = initialDeposit * Math.pow(1 + monthlyRate, months);
    
    // Calculate future value of monthly contributions
    let futureValueContributions = 0;
    if (monthlyRate > 0) {
      futureValueContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      futureValueContributions = monthlyContribution * months;
    }
    
    return futureValueInitial + futureValueContributions;
  };

  const monthlyLoanPayment = calculateLoanPayment();
  const totalLoanPayment = monthlyLoanPayment * loanTerm * 12;
  const totalLoanInterest = totalLoanPayment - loanAmount;

  const futureSavings = calculateFutureSavings();
  const totalContributions = initialDeposit + (monthlyContribution * savingsTerm * 12);
  const interestEarned = futureSavings - totalContributions;

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Financial Calculator | Fund Pilot</title>
          <meta
            name="description"
            content="Use our financial calculators to plan your loans, savings, and more."
          />
        </Helmet>

        <Sidebar />

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />

          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Financial Calculator
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Calculate loans, savings, and perform basic financial operations.
              </p>
            </div>

            <Tabs defaultValue="basic">
              <TabsList className="mb-6">
                <TabsTrigger value="basic">Basic Calculator</TabsTrigger>
                <TabsTrigger value="loan">Loan Calculator</TabsTrigger>
                <TabsTrigger value="savings">Savings Calculator</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Calculator</CardTitle>
                    <CardDescription>
                      Perform simple calculations and financial operations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="calculator-container max-w-md mx-auto">
                      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white text-right">
                        <div className="text-3xl font-semibold">{display}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          onClick={clearAll}
                          className="text-red-500 font-semibold"
                        >
                          AC
                        </Button>
                        <Button
                          variant="outline"
                          onClick={toggleSign}
                        >
                          +/-
                        </Button>
                        <Button
                          variant="outline"
                          onClick={percentage}
                        >
                          %
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => performOperation("/")}
                        >
                          ÷
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => inputDigit("7")}
                        >
                          7
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("8")}
                        >
                          8
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("9")}
                        >
                          9
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => performOperation("*")}
                        >
                          ×
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => inputDigit("4")}
                        >
                          4
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("5")}
                        >
                          5
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("6")}
                        >
                          6
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => performOperation("-")}
                        >
                          −
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => inputDigit("1")}
                        >
                          1
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("2")}
                        >
                          2
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => inputDigit("3")}
                        >
                          3
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => performOperation("+")}
                        >
                          +
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => inputDigit("0")}
                          className="col-span-2"
                        >
                          0
                        </Button>
                        <Button
                          variant="outline"
                          onClick={inputDecimal}
                        >
                          .
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleEquals}
                        >
                          =
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loan">
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Calculator</CardTitle>
                    <CardDescription>
                      Calculate monthly payments for a loan or mortgage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="loan-amount">Loan Amount</Label>
                            <div className="font-medium">
                              {formatAmount(loanAmount)}
                            </div>
                          </div>
                          <Slider
                            id="loan-amount"
                            min={1000}
                            max={1000000}
                            step={1000}
                            value={[loanAmount]}
                            onValueChange={(value) => setLoanAmount(value[0])}
                          />
                          <Input
                            type="number"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="mt-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="loan-interest">Interest Rate (%)</Label>
                            <div className="font-medium">{loanInterest}%</div>
                          </div>
                          <Slider
                            id="loan-interest"
                            min={0}
                            max={20}
                            step={0.1}
                            value={[loanInterest]}
                            onValueChange={(value) => setLoanInterest(value[0])}
                          />
                          <Input
                            type="number"
                            value={loanInterest}
                            onChange={(e) => setLoanInterest(Number(e.target.value))}
                            className="mt-2"
                            step="0.1"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="loan-term">Term (Years)</Label>
                            <div className="font-medium">{loanTerm} years</div>
                          </div>
                          <Slider
                            id="loan-term"
                            min={1}
                            max={30}
                            step={1}
                            value={[loanTerm]}
                            onValueChange={(value) => setLoanTerm(value[0])}
                          />
                          <Input
                            type="number"
                            value={loanTerm}
                            onChange={(e) => setLoanTerm(Number(e.target.value))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="bg-primary-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Loan Summary
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-500">
                              Monthly Payment
                            </div>
                            <div className="text-2xl font-bold text-primary-700">
                              {formatAmount(monthlyLoanPayment)}
                            </div>
                          </div>

                          <hr className="border-primary-100" />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">
                                Total Principal
                              </div>
                              <div className="font-semibold">
                                {formatAmount(loanAmount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                Total Interest
                              </div>
                              <div className="font-semibold">
                                {formatAmount(totalLoanInterest)}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500">
                              Total Payment
                            </div>
                            <div className="font-semibold">
                              {formatAmount(totalLoanPayment)}
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="w-full bg-primary-100 rounded-full h-2 mb-1">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{
                                  width: `${(loanAmount / totalLoanPayment) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Principal</span>
                              <span>Interest</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="savings">
                <Card>
                  <CardHeader>
                    <CardTitle>Savings Calculator</CardTitle>
                    <CardDescription>
                      Calculate how your savings will grow over time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="initial-deposit">Initial Deposit</Label>
                            <div className="font-medium">
                              {formatAmount(initialDeposit)}
                            </div>
                          </div>
                          <Slider
                            id="initial-deposit"
                            min={0}
                            max={50000}
                            step={100}
                            value={[initialDeposit]}
                            onValueChange={(value) => setInitialDeposit(value[0])}
                          />
                          <Input
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(Number(e.target.value))}
                            className="mt-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
                            <div className="font-medium">
                              {formatAmount(monthlyContribution)}
                            </div>
                          </div>
                          <Slider
                            id="monthly-contribution"
                            min={0}
                            max={2000}
                            step={10}
                            value={[monthlyContribution]}
                            onValueChange={(value) => setMonthlyContribution(value[0])}
                          />
                          <Input
                            type="number"
                            value={monthlyContribution}
                            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                            className="mt-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="savings-interest">Interest Rate (%)</Label>
                            <div className="font-medium">{savingsInterest}%</div>
                          </div>
                          <Slider
                            id="savings-interest"
                            min={0}
                            max={15}
                            step={0.1}
                            value={[savingsInterest]}
                            onValueChange={(value) => setSavingsInterest(value[0])}
                          />
                          <Input
                            type="number"
                            value={savingsInterest}
                            onChange={(e) => setSavingsInterest(Number(e.target.value))}
                            className="mt-2"
                            step="0.1"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="savings-term">Term (Years)</Label>
                            <div className="font-medium">{savingsTerm} years</div>
                          </div>
                          <Slider
                            id="savings-term"
                            min={1}
                            max={40}
                            step={1}
                            value={[savingsTerm]}
                            onValueChange={(value) => setSavingsTerm(value[0])}
                          />
                          <Input
                            type="number"
                            value={savingsTerm}
                            onChange={(e) => setSavingsTerm(Number(e.target.value))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Savings Summary
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-500">
                              Future Value
                            </div>
                            <div className="text-2xl font-bold text-green-700">
                              {formatAmount(futureSavings)}
                            </div>
                          </div>

                          <hr className="border-green-100" />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">
                                Initial Deposit
                              </div>
                              <div className="font-semibold">
                                {formatAmount(initialDeposit)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                Total Contributions
                              </div>
                              <div className="font-semibold">
                                {formatAmount(totalContributions)}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500">
                              Interest Earned
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatAmount(interestEarned)}
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="w-full bg-green-100 rounded-full h-2 mb-1">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(totalContributions / futureSavings) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Contributions</span>
                              <span>Interest</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <MobileNav />
    </CurrencyProvider>
  );
}
