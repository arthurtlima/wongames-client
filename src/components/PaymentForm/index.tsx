import { Session } from 'next-auth'
import { useState, useEffect } from 'react'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { StripeCardElementChangeEvent } from '@stripe/stripe-js'
import { ErrorOutline, ShoppingCart } from '@styled-icons/material-outlined'

import { useCart } from 'hooks/use-cart'
import Button from 'components/Button'
import Heading from 'components/Heading'

import * as S from './styles'
import { createPaymentIntent } from 'utils/stripe/methods'
import { FormLoading } from 'components/Form'

type PaymentFormProps = {
  session: Session
}

const PaymentForm = ({ session }: PaymentFormProps) => {
  const { items } = useCart()
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [disabled, setDisabled] = useState(true)
  const [clientSecret, setClientSecret] = useState('')
  const [freeGames, setFreeGames] = useState(false)

  useEffect(() => {
    async function setPaymentMode() {
      if (items.length) {
        // bater na api /orders/create-payment-intent
        const data = await createPaymentIntent({
          items,
          token: session?.jwt as string
        })

        // se eu receber freeGames: true
        // segue o fluxo gratuito
        if (data.freeGames) {
          setFreeGames(true)
          return
        }

        // se eu receber um erro
        // setError
        if (data.error) {
          setError(data.error)
          return
        }

        // senão o paymentIntent foi válido
        // setClientSecret
        setFreeGames(false)
        setClientSecret(data.client_secret)
      }
    }

    setPaymentMode()
  }, [items, session])

  const handleChange = async (event: StripeCardElementChangeEvent) => {
    setDisabled(event.empty)
    setError(event.error ? event.error.message : null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    // se for freeGames
    // salva no banco
    // redireciona para success

    const payload = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements!.getElement(CardElement)!
      }
    })

    if (payload.error) {
      setError(`Payment failed ${payload.error.message}`)
      setLoading(false)
    } else {
      setError(null)
      setLoading(false)

      // salvar a compra no banco do Strapi
      // redirectionar para a página de Sucesso
    }
  }

  return (
    <S.Wrapper>
      <form onSubmit={handleSubmit}>
        <S.Body>
          <Heading color="black" size="small" lineBottom>
            Payment
          </Heading>

          {freeGames ? (
            <S.FreeGames>Only free games, click buy and enjoy!</S.FreeGames>
          ) : (
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '16px'
                  }
                }
              }}
              onChange={handleChange}
            />
          )}
          {error && (
            <S.Error>
              <ErrorOutline size={20} />
              {error}
            </S.Error>
          )}
        </S.Body>
        <S.Footer>
          <Button as="a" fullWidth minimal>
            Continue shopping
          </Button>
          <Button
            fullWidth
            icon={loading ? <FormLoading /> : <ShoppingCart />}
            disabled={!freeGames && (disabled || !!error)}
          >
            {!loading && <span>Buy now</span>}
          </Button>
        </S.Footer>
      </form>
    </S.Wrapper>
  )
}

export default PaymentForm
