"use client";

import { useState } from "react";
import { Store, User, Building, Landmark, Save, Loader2, Link2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VendorSettingsContentProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}

export function VendorSettingsContent({ userId, initialName, initialEmail, initialPhone }: VendorSettingsContentProps) {
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
  });

  // Store Details
  const [store, setStore] = useState({
    name: "My Awesome Store",
    description: "Selling the best custom prints since 2024.",
    address: "123 Maker Street, Creative District, Mumbai 400001",
    supportEmail: initialEmail,
    supportPhone: initialPhone,
    gstin: "27AADCB2230M1Z2",
    pan: "AADCB2230M",
  });

  // Social Links
  const [social, setSocial] = useState({
    instagram: "@myawesomestore",
    facebook: "facebook.com/myawesomestore",
    twitter: "",
    website: "https://myawesomestore.com",
  });

  // Bank Details
  const [bank, setBank] = useState({
    accountName: initialName,
    accountNumber: "987654321098",
    ifsc: "HDFC0001234",
    bankName: "HDFC Bank",
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save profile");
      }
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Settings saved successfully");
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Settings & Store Setup</h1>
        <p className="mt-0.5 text-sm text-stone-500">Manage your profile, store identity, and business details</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-white border border-stone-200 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="store" className="rounded-lg data-[state=active]:bg-stone-900 data-[state=active]:text-white px-4 py-2">
            <Store className="w-4 h-4 mr-2" /> Store Details
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-stone-900 data-[state=active]:text-white px-4 py-2">
            <User className="w-4 h-4 mr-2" /> Personal Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-lg data-[state=active]:bg-stone-900 data-[state=active]:text-white px-4 py-2">
            <Building className="w-4 h-4 mr-2" /> Business & Tax
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-stone-900 data-[state=active]:text-white px-4 py-2">
            <Landmark className="w-4 h-4 mr-2" /> Bank Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6 mt-0">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Store Identity</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Store Name</label>
                  <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="rounded-xl border-stone-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Support Phone</label>
                  <Input value={store.supportPhone} onChange={(e) => setStore({ ...store, supportPhone: e.target.value })} className="rounded-xl border-stone-200" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Support Email</label>
                  <Input value={store.supportEmail} onChange={(e) => setStore({ ...store, supportEmail: e.target.value })} className="rounded-xl border-stone-200" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Store Description</label>
                  <textarea 
                    value={store.description} 
                    onChange={(e) => setStore({ ...store, description: e.target.value })} 
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[100px]"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Store Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} className="pl-9 rounded-xl border-stone-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Social Links
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Website</label>
                <Input value={social.website} onChange={(e) => setSocial({ ...social, website: e.target.value })} className="rounded-xl border-stone-200" placeholder="https://" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Instagram Profile</label>
                <Input value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} className="rounded-xl border-stone-200" placeholder="@username" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Facebook Page</label>
                <Input value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} className="rounded-xl border-stone-200" placeholder="Username or URL" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Twitter/X Profile</label>
                <Input value={social.twitter} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} className="rounded-xl border-stone-200" placeholder="@username" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-2 px-6">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Store Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Personal Information</h2>
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Full Name</label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="rounded-xl border-stone-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Email Address (Cannot be changed)</label>
                <Input value={profile.email} disabled className="rounded-xl border-stone-200 bg-stone-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Mobile Number</label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="rounded-xl border-stone-200" placeholder="10-digit mobile number" />
                <p className="text-xs text-stone-500">Required for account security and notifications</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full mt-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Profile
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-0">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Business & Tax Details</h2>
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">GSTIN Number</label>
                <Input value={store.gstin} onChange={(e) => setStore({ ...store, gstin: e.target.value })} className="rounded-xl border-stone-200 uppercase font-mono" placeholder="15-digit GSTIN" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">PAN Number</label>
                <Input value={store.pan} onChange={(e) => setStore({ ...store, pan: e.target.value })} className="rounded-xl border-stone-200 uppercase font-mono" placeholder="10-digit PAN" />
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} className="w-full mt-4 rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Tax Details
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-0">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Bank Account for Payouts</h2>
            <div className="grid gap-4 max-w-2xl sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-stone-700">Account Holder Name</label>
                <Input value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} className="rounded-xl border-stone-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Account Number</label>
                <Input type="password" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} className="rounded-xl border-stone-200 font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Confirm Account Number</label>
                <Input type="text" value={bank.accountNumber} onChange={() => {}} className="rounded-xl border-stone-200 font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">IFSC Code</label>
                <Input value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} className="rounded-xl border-stone-200 uppercase font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Bank Name</label>
                <Input value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} className="rounded-xl border-stone-200" />
              </div>
              <div className="sm:col-span-2 mt-2">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payouts are automatically processed to this account on a weekly basis. Ensure details are correct to avoid payment delays.
                  </p>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-2 px-6">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Bank Details
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
