import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BotonVolver from '../components/ui/BotonVolver';
import BracketCopa from '../components/admin/BracketCopa';

function AdminCopaDetailPage() {
    const [copa, setCopa] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: copaId } = useParams();
    const { token } = useAuth();

    const fetchCopaDetalle = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await api.get(`/copas/${copaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCopa(response.data);
        } catch (err) {
            toast.error('No se pudo cargar la información de la copa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCopaDetalle();
    }, [copaId, token]);

    const handleConfirmarPartido = async (partido) => {
        if (!window.confirm(`¿Seguro que quieres aprobar el resultado ${partido.goles_local} - ${partido.goles_visitante}?`)) return;
        
        try {
            // Apuntamos al endpoint correcto para confirmar partidos de copa
            await api.put(`/partidos_copa/${partido.id}/confirmar`, 
                { estado: 'aprobado' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Resultado confirmado. ¡El bracket se ha actualizado!");
            fetchCopaDetalle(); // Recargamos la data para ver el avance del ganador
        } catch(err) {
            toast.error(err.response?.data?.error || "Error al confirmar el resultado.");
        }
    }

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;
    if (!copa) return <p className="text-center p-8">No se encontró la copa.</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BotonVolver />
            
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
                <h2 className="text-3xl font-bold text-white">{copa.nombre}</h2>
                <p className="mt-1 text-sm text-gray-300">Temporada: {copa.temporada || 'N/A'}</p>
            </div>

            <BracketCopa fixture={copa.fixture} onConfirmarPartido={handleConfirmarPartido} />
        </div>
    );
}

export default AdminCopaDetailPage;
