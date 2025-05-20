const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use environment variable

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            // Create a Checkout Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'gbp',
                            product_data: {
                                name: 'Unlock Page Downloads',
                                description: 'Unlock the ability to download HTML and CSS for your generated page.',
                            },
                            unit_amount: 2000, // 2000 pence = £20.00
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.headers.origin}/lab.html?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/lab.html?payment_cancelled=true`,
            });

            res.status(200).json({ sessionId: session.id });
        } catch (error) {
            console.error('Error creating Stripe session:', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    } else {
        // Handle any non-POST requests
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
};
