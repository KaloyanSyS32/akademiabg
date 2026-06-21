import { supabase } from '../config/supabase.js';

export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session.user;
};

export const fetchUserProfile = async (userId) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, avatar_url')
        .eq('id', userId)
        .single();
        
    if (error) return null;
    return data;
};

export const fetchUserBookings = async (userId, role) => {
    if (!supabase) return [];
    const queryField = role === 'teacher' ? 'teacher_id' : 'student_id';
    
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            status,
            rate,
            profiles!bookings_student_id_fkey(full_name),
            teacher_profiles:profiles!bookings_teacher_id_fkey(full_name)
        `)
        .eq(queryField, userId)
        .order('booking_date', { ascending: true });

    if (error) return [];
    return data;
};

export const updateBookingStatus = async (bookingId, status) => {
    if (!supabase) return { error: new Error('Offline') };
    return await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select();
};