import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { customTripSchema } from '@/lib/validation/bookingSchema';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('custom_trip_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = customTripSchema.parse(body);

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: true,
          message: 'Custom trip inquiry received in development mode.',
          data: { id: 'temp-custom-' + Date.now(), ...validated },
        },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from('custom_trip_requests')
      .insert([
        {
          trip_type: validated.tripType,
          destinations: validated.destinations,
          traveller_count: validated.travellerCount,
          approximate_date: validated.approximateDate,
          duration: validated.duration || null,
          budget_preference: validated.budgetPreference || null,
          services_needed: validated.servicesNeeded || [],
          notes: validated.notes || null,
          customer_name: validated.customerName,
          phone: validated.phone,
          email: validated.email || null,
          status: 'new',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.errors ? err.errors[0]?.message : err.message },
      { status: 422 }
    );
  }
}

export async function PATCH(request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.id || !body.status) {
    return NextResponse.json({ success: false, error: 'Enquiry ID and status required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, data: body });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('custom_trip_requests')
    .update({ status: body.status })
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
