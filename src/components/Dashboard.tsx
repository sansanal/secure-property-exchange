
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfile from './UserProfile';
import AssetForm from './AssetForm';
import AssetList from './AssetList';
import RequestForm from './RequestForm';
import AssetCard from './AssetCard';
import { Asset, AssetFormData, InformationRequest, User } from '@/utils/types';
import StatusBadge from './StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { safeDateParser } from '@/utils/formatters';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [userRequests, setUserRequests] = useState<InformationRequest[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const [locationFilter, setLocationFilter] = useState('');
  const [profitabilityFilter, setProfitabilityFilter] = useState<number | undefined>(undefined);
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<number | undefined>(undefined);

  // Filtrar los activos usando tanto la ciudad como el país
  const filteredAssets = allAssets.filter((asset) => {
    const lowercasedFilter = locationFilter.toLowerCase();
    return (
      (asset.city?.toLowerCase().includes(lowercasedFilter) || 
      asset.country?.toLowerCase().includes(lowercasedFilter))
    );
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const { count } = await supabase
            .from('activos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          setUserProfile({
            id: user.id,
            role: profile.role || 'buyer_mandatary',
            registrationDate: user.created_at,
            isApproved: profile.is_approved || false,
            fullName: profile.full_name || '',
            email: user.email || '',
            assetsCount: count || 0,
            requestsCount: 0
          });
          if (profile.admin) setIsAdmin(true);
        }
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Acceso no autorizado',
          description: 'Debes iniciar sesión para acceder al dashboard',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setAuthChecked(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchUserAssets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: assets } = await supabase
          .from('activos')
          .select('*')
          .eq('user_id', user.id);
        setUserAssets(assets || []);
      }
    };

    fetchUserAssets();
  }, []);

  useEffect(() => {
    const fetchAllAssets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: assets } = await supabase
          .from('activos')
          .select('*')
          .neq('user_id', user.id);
        setAllAssets(assets || []);
      }
    };

    fetchAllAssets();
  }, []);

  const handleRequestInfo = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsRequestFormOpen(true);
  };

  const handleRequestSubmit = () => {
    setIsRequestFormOpen(false);
    // Aquí puedes agregar lógica para actualizar solicitudes después del envío
  };

  const handleAssetSubmit = () => {
    // Lógica post-envío de activo
  };

  const handleSignNda = (requestId: string) => {
    // Aquí va la lógica para firmar NDA
  };

  const getAssetById = (id: string) => {
    return allAssets.find(asset => asset.id === id);
  };

  const mockAssets = filteredAssets;

  if (!isAdmin && authChecked) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            {userProfile && <UserProfile user={userProfile} />}
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="discover" className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex border-[#E1D48A]">
                <TabsTrigger value="discover" className="data-[state=active]:border-[#E1D48A] data-[state=active]:border-b-2">
                  Descubrir Activos
                </TabsTrigger>
                <TabsTrigger value="my-assets" className="data-[state=active]:border-[#E1D48A] data-[state=active]:border-b-2">
                  Mis Activos
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:border-[#E1D48A] data-[state=active]:border-b-2">
                  Mis Solicitudes
                </TabsTrigger>
                <TabsTrigger value="new-asset" className="data-[state=active]:border-[#E1D48A] data-[state=active]:border-b-2">
                  Subir Activo
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="admin" className="data-[state=active]:border-[#E1D48A] data-[state=active]:border-b-2">
                    Panel de Admin
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="discover" className="mt-16 md:mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label htmlFor="location">Localización:</label>
                    <input
                      type="text"
                      id="location"
                      className="border rounded px-2 py-1 w-full"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="profitability">Rentabilidad:</label>
                    <input
                      type="number"
                      id="profitability"
                      className="border rounded px-2 py-1 w-full"
                      value={profitabilityFilter || ''}
                      onChange={(e) => setProfitabilityFilter(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="assetType">Tipo de Activo:</label>
                    <select
                      id="assetType"
                      className="border rounded px-2 py-1 w-full"
                      value={assetTypeFilter}
                      onChange={(e) => setAssetTypeFilter(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                      <option value="greenfield">Greenfield</option>
                      <option value="brownfield">Brownfield</option>
                      <option value="land">Terreno</option>
                      <option value="hotel">Hotel</option>
                      <option value="industrial">Industrial</option>
                      <option value="mixed">Mixto</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="price">Precio:</label>
                    <input
                      type="number"
                      id="price"
                      className="border rounded px-2 py-1 w-full"
                      value={priceFilter || ''}
                      onChange={(e) => setPriceFilter(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                </div>
                <AssetList
                  assets={mockAssets}
                  location={locationFilter}
                  profitability={profitabilityFilter}
                  assetType={assetTypeFilter}
                  price={priceFilter?.toString() ?? ''}
                  onRequestInfo={(assetId) => handleRequestInfo(getAssetById(assetId))}
                  buttonStyle="bg-[#E1D48A] hover:bg-[#E1D48A]/90 text-estate-navy"
                />
                <RequestForm
                  asset={selectedAsset}
                  open={isRequestFormOpen}
                  onClose={() => setIsRequestFormOpen(false)}
                  onSubmit={handleRequestSubmit}
                  buttonStyle="bg-[#E1D48A] hover:bg-[#E1D48A]/90 text-estate-navy"
                />
              </TabsContent>

              <TabsContent value="my-assets" className="mt-16 md:mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mis Activos Enviados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userAssets.length === 0 ? (
                      <div className="text-center py-8 bg-estate-offwhite rounded-md">
                        <p className="text-estate-steel">Aún no ha enviado ningún activo.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userAssets.map(asset => (
                          <AssetCard key={asset.id} asset={asset} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="mt-16 md:mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitudes de Información</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userRequests.length === 0 ? (
                      <div className="text-center py-8 bg-estate-offwhite rounded-md">
                        <p className="text-estate-steel">Aún no ha realizado ninguna solicitud de información.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID de Solicitud</TableHead>
                              <TableHead>Activo</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-left">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userRequests.map(request => {
                              const asset = getAssetById(request.assetId);
                              return (
                                <TableRow key={request.id}>
                                  <TableCell className="font-medium">{request.id}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>{asset?.id}</span>
                                      <span className="text-xs text-estate-steel">{asset?.type} en {asset?.city}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {safeDateParser(asset.creado)?.toLocaleDateString('es-ES') ?? 'Fecha inválida'}
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={request.status} />
                                  </TableCell>
                                  <TableCell className="text-left">
                                    {request.status === 'nda_requested' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSignNda(request.id)}
                                        className="flex items-center gap-1 w-full"
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span>Firmar NDA</span>
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new-asset" className="mt-16 md:mt-6 space-y-6">
                <AssetForm onSubmit={handleAssetSubmit} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return null;
};


export default Dashboard;
