'use client';

import { useState } from 'react';
import { uploadSystemLogo } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>('/logo.png');

    const handleUpload = async (formData: FormData) => {
        setIsUploading(true);
        try {
            const result = await uploadSystemLogo(formData);
            if (result.success) {
                // Force browser to reload image by adding timestamp
                setPreview(`/logo.png?t=${Date.now()}`);
                alert('Logo uploaded successfully!');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">System Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Company Logo</CardTitle>
                    <CardDescription>
                        Upload your company logo to be displayed on assessment forms.
                        Recommended size: 200x200px (Square or Landscape).
                        Format: PNG or JPG.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpload} className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="border rounded-lg p-4 bg-slate-50 w-32 h-32 flex items-center justify-center relative overflow-hidden">
                                {/* Visual Preview */}
                                <img
                                    src={preview || '/logo.png'}
                                    alt="Current Logo"
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Show placeholder text if image fails
                                        e.currentTarget.parentElement?.classList.add('after:content-["NO_LOGO"]', 'after:text-xs', 'after:text-slate-400');
                                    }}
                                />
                            </div>

                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="logo">Logo File</Label>
                                <Input id="logo" name="logo" type="file" accept="image/png, image/jpeg" required />
                            </div>
                        </div>

                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Logo
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
