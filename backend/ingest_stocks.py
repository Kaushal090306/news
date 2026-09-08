import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ingestion.fetcher import IngestionPipeline

async def main():
    print("Syncing 63 sources to database...")
    IngestionPipeline.sync_source_registry()
    print("Sync complete! Ingesting stock sources...")
    
    stock_source_ids = [
        'et-markets', 'et-stocks', 'livemint-markets', 'moneycontrol-stocks',
        'moneycontrol-markets', 'bs-markets', 'yahoo-finance-stocks',
        'cnbc-markets', 'cnbc-investing', 'marketwatch-stocks', 'wsj-markets'
    ]
    
    for sid in stock_source_ids:
        try:
            res = await IngestionPipeline.run_ingestion_cycle(target_source_id=sid)
            print(f"[{sid}] processed: found={res.get('articles_found', 0)}, added={res.get('articles_added', 0)}, dups={res.get('duplicates_filtered', 0)}")
        except Exception as e:
            print(f"[{sid}] error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
