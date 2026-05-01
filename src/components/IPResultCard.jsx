import styles from './IPResultCard.module.css'

const fields = [
  { key: 'ip',           label: 'IP Address'   },
  { key: 'hostname',     label: 'Hostname'      },
  { key: 'city',         label: 'City'          },
  { key: 'region',       label: 'Region'        },
  { key: 'country_name', label: 'Country'       },
  { key: 'postal',       label: 'Postal Code'   },
  { key: 'latitude',     label: 'Latitude'      },
  { key: 'longitude',    label: 'Longitude'     },
  { key: 'timezone',     label: 'Timezone'      },
  { key: 'org',          label: 'Organization'  },
  { key: 'asn',          label: 'ASN'           },
]

export default function IPResultCard({ data }) {
  if (!data) return null

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.statusDot} />
        <h2 className={styles.cardTitle}>Scan Complete</h2>
      </div>
      <dl className={styles.grid}>
        {fields.map(({ key, label }) => {
          const value = data[key]
          if (!value && value !== 0) return null
          return (
            <div className={styles.field} key={key}>
              <dt className={styles.fieldLabel}>{label}</dt>
              <dd className={styles.fieldValue}>{String(value)}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
