import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExternalLink, Bitcoin } from "lucide-react";
import { GearLoader } from "@/components/ui/gear-loader";

/**
 * Public client portal - no authentication required
 * Clients access via unique token: /portal/{accessToken}
 */
export default function ClientPortal() {
  const params = useParams();
  const accessToken = params.accessToken as string;
  
  const { data: client, isLoading: clientLoading, error: clientError } = trpc.clientPortal.getClientInfo.useQuery(
    { accessToken },
    { 
      enabled: !!accessToken,
      retry: false, // Don't retry on invalid token
      refetchOnWindowFocus: false // Don't refetch on window focus
    }
  );
  
  const { data: invoices, isLoading: invoicesLoading } = trpc.clientPortal.getInvoices.useQuery(
    { accessToken },
    { 
      enabled: !!accessToken && !!client, // Only fetch if client is valid
      retry: false,
      refetchOnWindowFocus: false
    }
  );
  
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No access token provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (clientLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }
  
  if (clientError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Invalid or expired access token. Please contact your service provider.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
          <p className="text-muted-foreground">
            Welcome, {client.name}
          </p>
        </div>
        
        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {!invoices || invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No invoices found.
              </p>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Invoice #{invoice.invoiceNumber}
                        </h3>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Date: {formatDate(invoice.invoiceDate)}
                        {invoice.dueDate && ` • Due: ${formatDate(invoice.dueDate)}`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(parseFloat(invoice.total))}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {invoice.stripePaymentLinkUrl && invoice.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => window.open(invoice.stripePaymentLinkUrl, "_blank")}
                          >
                            Pay Now
                          </Button>
                        )}
                        {invoice.cryptoPaymentUrl && invoice.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(invoice.cryptoPaymentUrl, "_blank")}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Bitcoin className="h-4 w-4 mr-1" />
                            Pay with Crypto
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/invoices/${invoice.id}/pdf?token=${accessToken}`, "_blank")}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>If you have any questions, please contact your service provider.</p>
        </div>
      </div>
    </div>
  );
}
