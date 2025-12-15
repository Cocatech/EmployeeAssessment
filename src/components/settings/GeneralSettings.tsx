'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateSystemSetting, uploadSettingFile } from '@/actions/settings';
import { Loader2, Upload, ImageIcon, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GeneralSettingsProps {
    initialSettings: Record<string, string>;
}

export default function GeneralSettings({ initialSettings }: GeneralSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(initialSettings);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const { toast } = useToast();

    // Refs for hidden file inputs
    const siteLogoInputRef = useRef<HTMLInputElement>(null);
    const formLogoInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (key: string, file: File) => {
        setUploadingKey(key);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadSettingFile(formData);

            if (result.success && result.data) {
                await updateSystemSetting(key, result.data, 'image', key === 'site_logo' ? 'Site Logo' : 'Form Logo');
                setSettings(prev => ({ ...prev, [key]: result.data }));
                toast({ title: 'Success', description: 'Logo updated successfully' });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
        } finally {
            setUploadingKey(null);
            setLoading(false);
        }
    };


    const LogoUploader = ({
        settingKey,
        title,
        description,
        currentUrl,
        width,
        height,
        recommendedSize,
        inputRef
    }: {
        settingKey: string;
        title: string;
        description: string;
        currentUrl?: string;
        width: number;
        height: number;
        recommendedSize: string;
        inputRef: React.RefObject<HTMLInputElement | null>;
    }) => {
        const isUploading = uploadingKey === settingKey;

        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                        {/* Preview Container */}
                        <div className={cn(
                            "relative border-2 border-dashed rounded-xl bg-slate-50/50 flex items-center justify-center overflow-hidden transition-all",
                            isUploading ? "opacity-50" : "hover:bg-slate-100/50"
                        )}
                            style={{ width: 240, height: 160 }}
                        >
                            {currentUrl ? (
                                <div className="relative w-full h-full p-4">
                                    <Image
                                        src={currentUrl}
                                        alt={title}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <ImageIcon className="h-10 w-10" />
                                    <span className="text-xs">No image set</span>
                                </div>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <Label className="text-base font-semibold">Upload Image</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Supported formats: PNG, SVG, JPG.
                                    <br />
                                    Recommended size: <span className="font-medium text-foreground">{recommendedSize}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    ref={inputRef}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(settingKey, file);
                                        // Reset input so same file can be selected again if needed
                                        e.target.value = '';
                                    }}
                                />

                                <Button
                                    onClick={() => inputRef.current?.click()}
                                    disabled={loading}
                                    variant={currentUrl ? "outline" : "default"}
                                    className="min-w-[140px]"
                                >
                                    {isUploading ? (
                                        'Uploading...'
                                    ) : (
                                        <>
                                            {currentUrl ? <RefreshCw className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {currentUrl ? 'Change Logo' : 'Upload Logo'}
                                        </>
                                    )}
                                </Button>

                                {currentUrl && (
                                    <Button variant="ghost" size="icon" disabled={loading}>
                                        {/* Add delete functionality later if needed */}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <LogoUploader
                settingKey="site_logo"
                title="Site Branding"
                description="The main logo displayed in the sidebar navigation."
                currentUrl={settings.site_logo}
                width={150}
                height={50}
                recommendedSize="150x50px (Landscape)"
                inputRef={siteLogoInputRef}
            />

            <LogoUploader
                settingKey="form_logo"
                title="Form Header Branding"
                description="Logo used in the header of printed and exported assessment forms."
                currentUrl={settings.form_logo}
                width={100}
                height={100}
                recommendedSize="Height 50-80px (Width flexible)"
                inputRef={formLogoInputRef}
            />
        </div>
    );
}
